const express = require('express');
const router = express.Router();
const { uploadPaymentProof, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', protect, upload.single('proof'), uploadPaymentProof);
router.put('/:id/verify', protect, authorize('teacher', 'admin'), verifyPayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
