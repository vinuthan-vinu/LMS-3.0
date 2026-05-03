/**
 * Exam Model
 * Manages exams, submissions, and results
 */
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
    required: true,
  },
  options: [String], // For multiple choice
  correctAnswer: String, // Store correct answer(s)
  marks: {
    type: Number,
    required: true,
    default: 1,
  },
});

const ExamSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  examType: {
    type: String,
    enum: ['quiz', 'midterm', 'final', 'assignment', 'practical'],
    required: [true, 'Exam type is required'],
  },
  instructions: {
    type: String,
    maxlength: 2000,
  },
  questions: [QuestionSchema],
  totalMarks: {
    type: Number,
    required: true,
  },
  passingMarks: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Exam duration is required'],
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  allowRetake: {
    type: Boolean,
    default: false,
  },
  maxAttempts: {
    type: Number,
    default: 1,
  },
  showResults: {
    type: Boolean,
    default: true,
  },
  randomizeQuestions: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ExamSchema.index({ course: 1, isPublished: 1 });
ExamSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('Exam', ExamSchema);
