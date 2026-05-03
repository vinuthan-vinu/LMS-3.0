const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function forceSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear users collection using raw driver to be sure
    await mongoose.connection.db.collection('users').deleteMany({});
    console.log('Cleared all users from database');

    // Create Admin
    await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@lms.com',
      password: 'password123',
      role: 'admin',
    });
    console.log('Admin created');

    // Create Student
    await User.create({
      firstName: 'Alex',
      lastName: 'Thompson',
      email: 'student@lms.com',
      password: 'password123',
      role: 'student',
    });
    console.log('Student created');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

forceSeed();
