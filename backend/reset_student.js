const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'student@lms.com';
    const newPassword = 'password123';

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Student not found');
      process.exit(1);
    }

    user.password = newPassword;
    await user.save();

    console.log(`Password for ${email} has been reset to ${newPassword}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();
