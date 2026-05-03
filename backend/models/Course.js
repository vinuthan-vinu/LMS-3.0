/**
 * Course Model
 * Schema for courses offered in the LMS
 */
const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: 2000,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Programming', 'Design', 'Business', 'Science', 'Arts', 'Language', 'Other'],
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: 1,
    max: 10,
  },
  duration: {
    type: Number, // in weeks
    required: [true, 'Duration is required'],
    min: 1,
  },
  schedule: {
    days: [String], // e.g., ['Monday', 'Wednesday', 'Friday']
    startTime: String, // e.g., '10:00 AM'
    endTime: String, // e.g., '11:30 AM'
    meetLink: String, // e.g., 'https://meet.google.com/abc-defg-hij'
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  maxStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: 1,
    default: 30,
  },
  enrolledStudents: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  syllabus: [{
    week: Number,
    topic: String,
    description: String,
    resources: [String],
  }],
  prerequisites: [String],
  learningOutcomes: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
CourseSchema.index({ courseCode: 1, status: 1 });
CourseSchema.index({ teacher: 1, status: 1 });

module.exports = mongoose.model('Course', CourseSchema);
