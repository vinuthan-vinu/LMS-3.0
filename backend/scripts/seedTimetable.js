const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Course = require('../models/Course');

async function seedTimetable() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Schedule 1: Advanced React Development
    await Course.findOneAndUpdate(
      { title: /React/i },
      {
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          startTime: '09:00 AM',
          endTime: '11:00 AM',
          meetLink: 'https://meet.google.com/demo-react'
        }
      }
    );

    // Schedule 2: UI/UX Design Fundamentals
    await Course.findOneAndUpdate(
      { title: /UI\/UX/i },
      {
        schedule: {
          days: ['Tuesday', 'Thursday'],
          startTime: '02:00 PM',
          endTime: '04:00 PM',
          meetLink: 'https://meet.google.com/demo-uiux'
        }
      }
    );

    // Schedule 3: Business Data Analysis
    await Course.findOneAndUpdate(
      { title: /Business Data/i },
      {
        schedule: {
          days: ['Saturday', 'Sunday'],
          startTime: '10:00 AM',
          endTime: '01:00 PM',
          meetLink: 'https://meet.google.com/demo-data'
        }
      }
    );

    console.log('✅ Weekly timetable seeded successfully!');
  } catch (error) {
    console.error('Failed to seed timetable:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedTimetable();
