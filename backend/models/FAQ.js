/**
 * FAQ Model
 * Stores frequently asked questions for chatbot
 */
const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    maxlength: 2000,
  },
  category: {
    type: String,
    enum: ['general', 'enrollment', 'payment', 'course', 'exam', 'technical', 'other'],
    default: 'general',
  },
  keywords: [{
    type: String,
    lowercase: true,
  }],
  isPublished: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  notHelpfulCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Text index for search
FAQSchema.index({ question: 'text', keywords: 'text', answer: 'text' });

module.exports = mongoose.model('FAQ', FAQSchema);
