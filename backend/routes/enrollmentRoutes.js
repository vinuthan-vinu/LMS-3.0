const express = require('express');
const router = express.Router();
const { createEnrollment, getEnrollments, updateEnrollmentStatus } = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/enroll', protect, createEnrollment);
router.get('/', protect, authorize('teacher', 'admin'), getEnrollments);
router.get('/my-enrollments', protect, getEnrollments);
router.put('/:id/status', protect, authorize('teacher', 'admin'), updateEnrollmentStatus);

module.exports = router;
