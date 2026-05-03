const express = require('express');
const router = express.Router();
const { uploadResource, getResourcesByCourse, deleteResource, getMyResources, createResourceLink, updateResource } = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/link', protect, authorize('teacher', 'admin'), createResourceLink);
router.post('/upload', protect, authorize('teacher', 'admin'), upload.single('file'), uploadResource);
router.get('/my-resources', protect, getMyResources);
router.get('/course/:courseId', protect, getResourcesByCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateResource);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteResource);

module.exports = router;
