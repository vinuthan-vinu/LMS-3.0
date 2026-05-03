const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { uploadToCloudinary } = require('../config/cloudinaryHandler');
const { asyncHandler } = require('../middleware/error');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Encryption utilities
const ENCRYPTION_KEY = (process.env.JWT_SECRET || 'secretkey').padEnd(32, '0').slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
}

// @desc    Upload payment proof
// @route   POST /api/payments/upload
// @access  Private (Student)
exports.uploadPaymentProof = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  const { course, enrollment, amount, paymentMethod, notes, payerNameOnSlip } = req.body;

  const nameTrimmed = typeof payerNameOnSlip === 'string' ? payerNameOnSlip.trim() : '';
  if (!nameTrimmed) {
    return res.status(400).json({ success: false, message: 'Your name as on the payment slip is required' });
  }

  if (!course || !mongoose.Types.ObjectId.isValid(course)) {
    return res.status(400).json({ success: false, message: 'Valid course ID is required' });
  }

  const courseExists = await Course.findById(course).select('_id');
  if (!courseExists) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const amountNum = Number(amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
  }

  const proofUrl = await uploadToCloudinary(req.file.path);

  let linkedEnrollment = enrollment && mongoose.Types.ObjectId.isValid(enrollment)
    ? await Enrollment.findOne({ _id: enrollment, student: req.user.id, course })
    : null;

  if (!linkedEnrollment) {
    linkedEnrollment = await Enrollment.findOne({ student: req.user.id, course });
  }

  if (!linkedEnrollment) {
    linkedEnrollment = await Enrollment.create({
      student: req.user.id,
      course,
      status: 'pending',
    });
    await Course.findByIdAndUpdate(course, { $inc: { enrolledStudents: 1 } });
  }

  const payment = await Payment.create({
    student: req.user.id,
    course,
    enrollment: linkedEnrollment._id,
    amount: amountNum,
    paymentMethod: paymentMethod || 'bank_transfer',
    paymentProof: proofUrl,
    notes: encrypt(notes),
    payerNameOnSlip: encrypt(nameTrimmed),
    status: 'pending'
  });

  const populated = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email')
    .populate('course', 'title courseCode');

  const responseData = populated.toObject();
  responseData.notes = decrypt(responseData.notes);
  responseData.payerNameOnSlip = decrypt(responseData.payerNameOnSlip);

  res.status(201).json({
    success: true,
    data: responseData
  });
});

// @desc    Verify payment
// @route   PUT /api/payments/:id/verify
// @access  Private (Admin)
exports.verifyPayment = asyncHandler(async (req, res) => {
  let { status, rejectionReason } = req.body;
  status = status || 'verified';

  const allowed = ['verified', 'rejected', 'pending'];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Use verified, rejected, or pending.',
    });
  }

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (req.user.role === 'teacher') {
    const ownedCourse = await Course.findOne({ _id: payment.course, teacher: req.user.id }).select('_id');
    if (!ownedCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify payment for this course' });
    }
  }

  payment.status = status;

  if (status === 'verified') {
    payment.rejectionReason = undefined;
    payment.verifiedBy = req.user.id;
    payment.verifiedAt = Date.now();
  } else if (status === 'rejected') {
    payment.rejectionReason = rejectionReason || 'Payment could not be verified.';
    payment.verifiedBy = req.user.id;
    payment.verifiedAt = undefined;
  } else {
    payment.rejectionReason = undefined;
    payment.verifiedBy = undefined;
    payment.verifiedAt = undefined;
  }

  await payment.save();

  const enrollmentQuery = payment.enrollment
    ? { _id: payment.enrollment }
    : { student: payment.student, course: payment.course };

  const enrollment = await Enrollment.findOne(enrollmentQuery);

  if (enrollment) {
    const previousEnrollmentStatus = enrollment.status;

    if (status === 'verified') {
      enrollment.status = 'approved';
      enrollment.approvalDate = Date.now();
      enrollment.approvedBy = req.user.id;
      enrollment.remarks = undefined;
    } else if (status === 'rejected') {
      enrollment.status = 'rejected';
      enrollment.approvalDate = Date.now();
      enrollment.approvedBy = req.user.id;
      enrollment.remarks = payment.rejectionReason || 'Payment rejected';
    } else {
      enrollment.status = 'pending';
      enrollment.approvalDate = undefined;
      enrollment.approvedBy = undefined;
      enrollment.remarks = undefined;
    }
    await enrollment.save();

    if (status === 'rejected' && previousEnrollmentStatus !== 'rejected') {
      const crs = await Course.findById(enrollment.course);
      if (crs) {
        crs.enrolledStudents = Math.max(0, (crs.enrolledStudents || 0) - 1);
        await crs.save();
      }
    }

    // Notify student about enrollment update
    if (status === 'verified' || status === 'rejected') {
      const crs = await Course.findById(enrollment.course).select('title');
      await Notification.create({
        title: status === 'verified' ? 'Enrollment Approved ✅' : 'Enrollment Rejected ❌',
        message: status === 'verified' 
          ? `Your enrollment for "${crs?.title || 'a course'}" has been verified and approved.` 
          : `Your enrollment for "${crs?.title || 'a course'}" was rejected. Reason: ${enrollment.remarks}`,
        type: 'system',
        audience: 'specific_user',
        recipient: payment.student,
        sender: req.user.id,
      }).catch(() => {});
    }
  }

  const populated = await Payment.findById(payment._id)
    .populate('student', 'firstName lastName email')
    .populate('course', 'title courseCode');

  const responseData = populated.toObject();
  responseData.notes = decrypt(responseData.notes);
  responseData.payerNameOnSlip = decrypt(responseData.payerNameOnSlip);

  res.status(200).json({
    success: true,
    data: responseData,
  });
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  let query = { student: req.user.id };

  if (req.user.role === 'admin') {
    query = {};
  } else if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    query = { course: { $in: courses.map((course) => course._id) } };
  }
  
  const payments = await Payment.find(query)
    .populate('student', 'firstName lastName email')
    .populate('course', 'title courseCode');

  const decryptedPayments = payments.map(p => {
    const obj = p.toObject();
    obj.notes = decrypt(obj.notes);
    obj.payerNameOnSlip = decrypt(obj.payerNameOnSlip);
    return obj;
  });

  res.status(200).json({
    success: true,
    count: decryptedPayments.length,
    data: decryptedPayments
  });
});
