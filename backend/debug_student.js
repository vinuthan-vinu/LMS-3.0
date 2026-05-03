const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function debugStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const student = await User.findOne({ email: 'student@lms.com' }).select('+password');
    if (!student) {
      console.log('Student not found');
    } else {
      console.log('Student found:');
      console.log(JSON.stringify(student, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugStudent();
