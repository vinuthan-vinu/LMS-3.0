/**
 * Payment Model
 * Tracks payments made by students for courses
 */
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'credit_card', 'debit_card', 'paypal', 'cash', 'other'],
    required: [true, 'Payment method is required'],
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  paymentProof: {
    type: String, // URL to uploaded file
    required: [true, 'Payment proof is required'],
  },
  paymentProofPublicId: String,
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'refunded'],
    default: 'pending',
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
  rejectionReason: {
    type: String,
    maxlength: 500,
  },
  notes: {
    type: String,
    maxlength: 1000,
  },
  /** Full name printed on the bank slip / transfer (entered by student for admin cross-check). */
  payerNameOnSlip: {
    type: String,
    maxlength: 200,
    trim: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
PaymentSchema.index({ student: 1, status: 1 });
PaymentSchema.index({ course: 1, status: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
