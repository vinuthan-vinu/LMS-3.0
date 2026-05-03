/**
 * Chat Message Model
 * Stores chatbot conversation history
 */
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  messageType: {
    type: String,
    enum: ['text', 'voice'],
    required: true,
  },
  userMessage: {
    text: {
      type: String,
      required: true,
    },
    audioUrl: String,
    audioPublicId: String,
    duration: Number, // audio duration in seconds
  },
  botResponse: {
    text: {
      type: String,
      required: true,
    },
    audioUrl: String,
    audioPublicId: String,
    duration: Number,
  },
  intent: {
    type: String,
    default: 'general',
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  source: {
    type: String,
    enum: ['faq', 'ai', 'manual', 'fallback'],
    default: 'fallback',
  },
  isHelpful: {
    type: Boolean,
  },
  sessionId: {
    type: String,
    index: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ChatMessageSchema.index({ user: 1, createdAt: -1 });
ChatMessageSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
