/**
 * Enrollment Model
 * Tracks student enrollments in courses
 */
const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'dropped'],
    default: 'pending',
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  approvalDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  completionDate: Date,
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Pass', 'Fail'],
  },
  remarks: {
    type: String,
    maxlength: 500,
  },
  attendance: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  finalScore: {
    type: Number,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Ensure unique enrollment per student per course
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Virtual for enrollment duration
EnrollmentSchema.virtual('enrollmentDuration').get(function() {
  if (this.completionDate) {
    return Math.ceil((this.completionDate - this.enrollmentDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((Date.now() - this.enrollmentDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
