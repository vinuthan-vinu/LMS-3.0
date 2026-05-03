const express = require('express');
const router = express.Router();
const { createCourse, getCourses, getCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const upload = require('../middleware/upload');

router.route('/')
  .get(optionalAuth, getCourses)
  .post(protect, authorize('teacher', 'admin'), upload.single('thumbnail'), createCourse);

router.route('/:id')
  .get(getCourse)
  .put(protect, authorize('teacher', 'admin'), upload.single('thumbnail'), updateCourse)
  .delete(protect, authorize('admin'), deleteCourse);

module.exports = router;
