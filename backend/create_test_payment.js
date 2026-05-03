const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Course = require('./models/Course');
const Payment = require('./models/Payment');
const Enrollment = require('./models/Enrollment');

dotenv.config();

async function createPendingPayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the student and course
    const student = await User.findOne({ role: 'student' });
    const course = await Course.findOne();

    if (!student || !course) {
      console.error('Student or Course not found. Please run force_seed.js first.');
      process.exit(1);
    }

    // Create enrollment first
    let enrollment = await Enrollment.findOne({ student: student._id, course: course._id });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: student._id,
        course: course._id,
        status: 'pending'
      });
      console.log('Created enrollment');
    }

    // Create a pending payment
    const payment = await Payment.create({
      student: student._id,
      course: course._id,
      enrollment: enrollment._id,
      amount: course.price || 199,
      paymentMethod: 'bank_transfer',
      paymentProof: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      status: 'pending',
      notes: 'Test pending payment for Admin'
    });

    console.log('Created pending payment:', payment._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createPendingPayment();
