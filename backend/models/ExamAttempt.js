const mongoose = require('mongoose');

const ExamAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  submitTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ongoing', 'submitted', 'expired'],
    default: 'ongoing'
  },
  score: Number
}, { timestamps: true });

module.exports = mongoose.model('ExamAttempt', ExamAttemptSchema);
