/**
 * Exam Submission Model
 * Stores student exam submissions and results
 */
const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  studentAnswer: {
    type: mongoose.Schema.Types.Mixed,
    default: '',
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  marksObtained: {
    type: Number,
    default: 0,
  },
});

const ExamSubmissionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam is required'],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
  },
  answers: [AnswerSchema],
  totalMarksObtained: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Pass', 'Fail'],
  },
  isPassed: {
    type: Boolean,
  },
  attemptNumber: {
    type: Number,
    default: 1,
  },
  startedAt: {
    type: Date,
    required: true,
  },
  submittedAt: {
    type: Date,
    required: true,
  },
  timeSpent: {
    type: Number, // in seconds
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'graded', 'expired'],
    default: 'in_progress',
  },
  remarks: {
    type: String,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Ensure unique active submission per exam per student
ExamSubmissionSchema.index({ exam: 1, student: 1, status: 1 });

// Calculate percentage and grade before saving
ExamSubmissionSchema.pre('save', function(next) {
  if (this.isModified('totalMarksObtained')) {
    const exam = this.exam;
    if (exam && exam.totalMarks) {
      this.percentage = (this.totalMarksObtained / exam.totalMarks) * 100;
      
      // Assign grade based on percentage
      if (this.percentage >= 90) this.grade = 'A+';
      else if (this.percentage >= 80) this.grade = 'A';
      else if (this.percentage >= 70) this.grade = 'B+';
      else if (this.percentage >= 60) this.grade = 'B';
      else if (this.percentage >= 50) this.grade = 'C';
      else if (this.percentage >= 40) this.grade = 'D';
      else this.grade = 'F';
      
      this.isPassed = this.percentage >= 40;
    }
  }
  next();
});

module.exports = mongoose.model('ExamSubmission', ExamSubmissionSchema);
