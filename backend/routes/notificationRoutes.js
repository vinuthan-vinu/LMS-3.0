const express = require('express');
const { getNotifications, createNotification, updateNotification, deleteNotification, markNotificationRead } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications)
  .post(createNotification);

router.put('/:id/read', markNotificationRead);
router.route('/:id').put(authorize('teacher', 'admin'), updateNotification).delete(authorize('teacher', 'admin'), deleteNotification);

module.exports = router;
