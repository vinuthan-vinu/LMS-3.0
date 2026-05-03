const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Course = require('./models/Course');
const Payment = require('./models/Payment');

dotenv.config();

async function checkPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const payments = await Payment.find()
      .populate('student', 'firstName lastName email')
      .populate('course', 'title');
    
    console.log('Payments found:', JSON.stringify(payments, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPayments();
