/**
 * Enrollment Controller
 * Handles student enrollments in courses
 */
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/error');

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private (Admin/Teacher)
const getEnrollments = asyncHandler(async (req, res) => {
  const { student, course, status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (student) query.student = student;
  if (course) query.course = course;
  if (status) query.status = status;

  // Students can only see their own enrollments
  if (req.user.role === 'student') {
    query.student = req.user.id;
  } else if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    query.course = { $in: courses.map((courseDoc) => courseDoc._id) };
  }

  const enrollments = await Enrollment.find(query)
    .populate('student', 'firstName lastName email avatar')
    .populate('course', 'title courseCode teacher schedule thumbnail category')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Enrollment.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      enrollments,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    },
  });
});

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
const getEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('student', 'firstName lastName email avatar')
    .populate('course')
    .populate('approvedBy', 'firstName lastName');

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found',
    });
  }

  // Check authorization
  if (req.user.role === 'student' && enrollment.student._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this enrollment',
    });
  }

  res.status(200).json({
    success: true,
    data: enrollment,
  });
});

// @desc    Create new enrollment
// @route   POST /api/enrollments
// @access  Private (Student)
const createEnrollment = asyncHandler(async (req, res) => {
  const { student, course } = req.body;

  // Students can only enroll themselves
  const studentId = req.user.role === 'student' ? req.user.id : student;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID is required',
    });
  }

  if (req.user.role === 'teacher') {
    const ownsCourse = await Course.exists({ _id: course, teacher: req.user.id });
    if (!ownsCourse) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to enroll students in this course',
      });
    }
  }

  // Check if course exists
  const courseExists = await Course.findById(course);
  if (!courseExists) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: studentId,
    course: course,
  });

  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this course',
    });
  }

  const enrollment = await Enrollment.create({
    student: studentId,
    course,
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    approvedBy: req.user.role === 'admin' ? req.user.id : null,
    approvalDate: req.user.role === 'admin' ? Date.now() : null,
  });

  // Increment course enrolled count
  courseExists.enrolledStudents += 1;
  await courseExists.save();

  res.status(201).json({
    success: true,
    message: 'Enrollment created successfully',
    data: enrollment,
  });
});

// @desc    Update enrollment status (approve/reject)
// @route   PUT /api/enrollments/:id/status
// @access  Private (Admin/Teacher)
const updateEnrollmentStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status',
    });
  }

  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found',
    });
  }

  if (req.user.role === 'teacher') {
    const ownsCourse = await Course.exists({ _id: enrollment.course, teacher: req.user.id });
    if (!ownsCourse) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment',
      });
    }
  }

  // Admin can always update; only non-admin is blocked from re-processing
  if (req.user.role !== 'admin' && enrollment.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Enrollment is already ${enrollment.status}`,
    });
  }

  enrollment.status = status;
  enrollment.approvedBy = req.user.id;
  enrollment.approvalDate = Date.now();
  enrollment.remarks = remarks;
  await enrollment.save();

  // Auto-create notification for the student
  const course = await Course.findById(enrollment.course).select('title');
  await Notification.create({
    title: status === 'approved' ? 'Enrollment Approved ✅' : 'Enrollment Rejected ❌',
    message: `Your enrollment for ${course?.title || 'a course'} has been ${status}. ${status === 'approved' ? 'You can now access the course!' : (remarks || 'Contact admin for details.')}`,
    type: 'alert',
    audience: 'specific_user',
    recipient: enrollment.student,
    sender: req.user.id,
  });

  // If rejected, decrement course enrolled count
  if (status === 'rejected') {
    if (course) {
      course.enrolledStudents = Math.max(0, course.enrolledStudents - 1);
      await course.save();
    }
  }

  res.status(200).json({
    success: true,
    message: `Enrollment ${status} successfully`,
    data: enrollment,
  });
});

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private (Admin/Teacher)
const updateEnrollmentProgress = asyncHandler(async (req, res) => {
  const { progress, attendance, finalScore, grade, status } = req.body;

  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found',
    });
  }

  if (req.user.role === 'teacher') {
    const ownsCourse = await Course.exists({ _id: enrollment.course, teacher: req.user.id });
    if (!ownsCourse) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment',
      });
    }
  }

  if (progress !== undefined) enrollment.progress = progress;
  if (attendance !== undefined) enrollment.attendance = attendance;
  if (finalScore !== undefined) enrollment.finalScore = finalScore;
  if (grade !== undefined) enrollment.grade = grade;
  if (status !== undefined) {
    enrollment.status = status;
    if (status === 'completed') {
      enrollment.completionDate = Date.now();
    }
  }

  await enrollment.save();

  res.status(200).json({
    success: true,
    message: 'Enrollment progress updated successfully',
    data: enrollment,
  });
});

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Admin)
const deleteEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: 'Enrollment not found',
    });
  }

  // Decrement course enrolled count
  const course = await Course.findById(enrollment.course);
  if (course) {
    course.enrolledStudents = Math.max(0, course.enrolledStudents - 1);
    await course.save();
  }

  await enrollment.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Enrollment deleted successfully',
  });
});

module.exports = {
  getEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollmentStatus,
  updateEnrollmentProgress,
  deleteEnrollment,
};
