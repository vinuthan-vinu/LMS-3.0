const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function seedStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const studentEmail = 'student@lms.com';
    const studentPassword = 'password123';

    const existingStudent = await User.findOne({ email: studentEmail });
    if (existingStudent) {
      console.log('Student already exists');
      process.exit(0);
    }

    // Note: User.js has a pre-save hook that hashes the password
    await User.create({
      firstName: 'Alex',
      lastName: 'Thompson',
      email: studentEmail,
      password: studentPassword,
      role: 'student',
    });

    console.log('Student user created successfully!');
    console.log(`Email: ${studentEmail}`);
    console.log(`Password: ${studentPassword}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedStudent();
