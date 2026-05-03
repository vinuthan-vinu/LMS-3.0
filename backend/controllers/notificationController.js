const Notification = require('../models/Notification');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { asyncHandler } = require('../middleware/error');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const notifications = await Notification.find().sort('-createdAt').limit(50);
    return res.status(200).json({ success: true, data: notifications });
  }

  let courseIds = [];
  if (req.user.role === 'student') {
    const enrollments = await Enrollment.find({ student: req.user.id, status: 'approved' }).select('course');
    courseIds = enrollments.map((enrollment) => enrollment.course);
  } else if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    courseIds = courses.map((course) => course._id);
  }

  const roleAudience = req.user.role === 'student' ? 'students' : 'teachers';
  const query = {
    $or: [
      { audience: 'all' },
      { audience: roleAudience, course: { $exists: false } },
      { audience: roleAudience, course: { $in: courseIds } },
      { audience: 'specific_user', recipient: req.user.id }
    ]
  };

  const notifications = await Notification.find(query).sort('-createdAt').limit(30);

  res.status(200).json({ success: true, data: notifications });
});

// @desc    Create a notification (Admin/Teacher)
// @route   POST /api/notifications
// @access  Private (Admin/Teacher)
const createNotification = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ success: false, message: 'Not authorized to send notifications' });
  }

  const { title, message, type, audience, course } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }

  if (req.user.role === 'teacher' && course) {
    const ownedCourse = await Course.findOne({ _id: course, teacher: req.user.id }).select('_id');
    if (!ownedCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized to notify this course' });
    }
  }

  const notification = await Notification.create({
    title,
    message,
    type: type || 'announcement',
    audience: audience || 'all',
    sender: req.user.id,
    course: course || undefined
  });

  res.status(201).json({
    success: true,
    message: 'Notification sent successfully',
    data: notification
  });
});

// @desc    Delete a notification (Admin only)
// @route   DELETE /api/notifications/:id
// @access  Private (Admin)
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  if (req.user.role !== 'admin' && notification.sender?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this notification' });
  }

  await notification.deleteOne();
  res.status(200).json({ success: true, message: 'Notification deleted' });
});

// @desc    Update a notification (Admin only)
// @route   PUT /api/notifications/:id
// @access  Private (Admin)
const updateNotification = asyncHandler(async (req, res) => {
  let notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  if (req.user.role !== 'admin' && notification.sender?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this notification' });
  }

  notification = await Notification.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: notification });
});

// @desc    Mark notification as read for current user
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { isReadBy: req.user.id } },
    { new: true, runValidators: true }
  );

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  res.status(200).json({ success: true, data: notification });
});

module.exports = {
  getNotifications,
  createNotification,
  deleteNotification,
  updateNotification,
  markNotificationRead
};
