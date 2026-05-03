const express = require('express');
const router = express.Router();
const { createExam, getExamsByCourse, submitExam, getResults, getMyExams, startExam, getAllResults, getAllExams, deleteExam, updateExam } = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher', 'admin'), createExam);
router.post('/start', protect, startExam);
router.get('/my-exams', protect, getMyExams);
router.get('/my-results', protect, getResults);
router.get('/all-results', protect, authorize('teacher', 'admin'), getAllResults);
router.get('/all', protect, authorize('teacher', 'admin'), getAllExams);
router.get('/course/:courseId', protect, getExamsByCourse);
router.post('/submit', protect, submitExam);
router.put('/:id', protect, authorize('teacher', 'admin'), updateExam);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteExam);

module.exports = router;
