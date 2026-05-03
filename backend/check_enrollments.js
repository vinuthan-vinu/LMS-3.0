const mongoose = require('mongoose');
const Enrollment = require('./backend/models/Enrollment');
const Course = require('./backend/models/Course');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ittpm_db')
  .then(async () => {
    const enrollments = await Enrollment.find().populate('course', 'title courseCode schedule status');
    console.log(JSON.stringify(enrollments, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
