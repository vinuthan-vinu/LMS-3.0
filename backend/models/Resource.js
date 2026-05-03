/**
 * Resource Model
 * Stores learning materials like PDFs, videos, notes
 */
const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
  },
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'audio', 'document', 'link', 'other'],
    required: [true, 'Resource type is required'],
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
  },
  filePublicId: String,
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number, // in bytes
  },
  mimeType: String,
  thumbnail: {
    type: String,
  },
  category: {
    type: String,
    enum: ['lecture', 'reading', 'assignment', 'supplementary', 'reference', 'other'],
    default: 'other',
  },
  week: {
    type: Number,
    min: 1,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
  isDownloadable: {
    type: Boolean,
    default: true,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ResourceSchema.index({ course: 1, isPublished: 1 });
ResourceSchema.index({ type: 1, category: 1 });

module.exports = mongoose.model('Resource', ResourceSchema);
