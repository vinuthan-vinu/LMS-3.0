const Resource = require('../models/Resource');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { uploadToCloudinary } = require('../config/cloudinaryHandler');
const { asyncHandler } = require('../middleware/error');
const Notification = require('../models/Notification');

const ALLOWED_TYPES = ['pdf', 'video', 'audio', 'document', 'link', 'other'];

const ensureCanManageCourse = async (req, courseId) => {
  const courseDoc = await Course.findById(courseId).select('teacher title');
  if (!courseDoc) {
    return { error: { status: 404, message: 'Course not found' } };
  }
  if (req.user.role === 'teacher' && courseDoc.teacher.toString() !== req.user.id.toString()) {
    return { error: { status: 403, message: 'Not authorized for this course' } };
  }
  return { courseDoc };
};

// @desc    Upload course resource
// @route   POST /api/resources/upload
// @access  Private (Teacher/Admin)
exports.uploadResource = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  const uploadResult = await uploadToCloudinary(req.file.path);
  
  const { course, title, description, type, category, week } = req.body;
  const { courseDoc, error } = await ensureCanManageCourse(req, course);
  if (error) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  const typeNorm = ALLOWED_TYPES.includes(type) ? type : 'other';

  const resource = await Resource.create({
    course,
    uploadedBy: req.user.id,
    title,
    description,
    type: typeNorm,
    category: category || 'lecture',
    week: week || 1,
    fileUrl: uploadResult,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size
  });

  // Notify students
  if (courseDoc) {
    await Notification.create({
      title: 'New Resource Uploaded 📖',
      message: `A new ${typeNorm || 'resource'} "${title}" has been uploaded for "${courseDoc.title}".`,
      type: 'class_update',
      audience: 'students',
      course: course,
      sender: req.user.id,
    }).catch(() => {});
  }

  const populatedResource = await Resource.findById(resource._id).populate('course', 'title courseCode');
  res.status(201).json({
    success: true,
    data: populatedResource
  });
});

// @desc    Register a resource by URL (no file upload) — admin/teacher quick add
// @route   POST /api/resources/link
// @access  Private (Teacher/Admin)
exports.createResourceLink = asyncHandler(async (req, res) => {
  const { course, title, description, type, fileUrl, category, week } = req.body;
  if (!course || !title || !fileUrl) {
    return res.status(400).json({ success: false, message: 'course, title, and fileUrl are required' });
  }
  const { courseDoc, error } = await ensureCanManageCourse(req, course);
  if (error) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  const typeNorm = ALLOWED_TYPES.includes(type) ? type : 'link';
  const resource = await Resource.create({
    course,
    uploadedBy: req.user.id,
    title,
    description,
    type: typeNorm,
    category: category || 'lecture',
    week: week || 1,
    fileUrl,
    fileName: title,
    fileSize: 0,
    mimeType: 'application/octet-stream',
    isPublished: true,
  });

  // Notify students
  if (courseDoc) {
    await Notification.create({
      title: 'New Resource Link Added 🔗',
      message: `A new link "${title}" has been added for "${courseDoc.title}".`,
      type: 'class_update',
      audience: 'students',
      course: course,
      sender: req.user.id,
    }).catch(() => {});
  }

  const populatedResource = await Resource.findById(resource._id).populate('course', 'title courseCode');
  res.status(201).json({ success: true, data: populatedResource });
});

// @desc    Get resources by course
// @route   GET /api/resources/course/:courseId
// @access  Private
exports.getResourcesByCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const courseDoc = await Course.findById(courseId).select('teacher');
  if (!courseDoc) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const { role, id } = req.user;
  if (role === 'admin') {
    /* ok */
  } else if (role === 'teacher') {
    if (courseDoc.teacher.toString() !== id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }
  } else {
    const enr = await Enrollment.findOne({
      student: id,
      course: courseId,
      status: 'approved',
    });
    if (!enr) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these resources' });
    }
  }

  const resources = await Resource.find({ course: courseId, isPublished: true });
  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// @desc    Get resources for all enrolled courses (Student)
// @route   GET /api/resources/my-resources
// @access  Private
exports.getMyResources = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const resources = await Resource.find({ isPublished: true })
      .populate('course', 'title courseCode')
      .populate('uploadedBy', 'firstName lastName email');
    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  }

  if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    const courseIds = courses.map((course) => course._id);
    const resources = await Resource.find({ course: { $in: courseIds }, isPublished: true })
      .populate('course', 'title courseCode');

    return res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  }

  const enrollments = await Enrollment.find({ student: req.user.id, status: 'approved' });
  const courseIds = enrollments.map(e => e.course);
  
  const resources = await Resource.find({ course: { $in: courseIds }, isPublished: true })
    .populate('course', 'title courseCode');

  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// @desc    Update resource metadata/link
// @route   PUT /api/resources/:id
// @access  Private (Teacher/Admin)
exports.updateResource = asyncHandler(async (req, res) => {
  let resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  if (req.user.role !== 'admin') {
    const ownsCourse = await Course.exists({ _id: resource.course, teacher: req.user.id });
    if (!ownsCourse && resource.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this resource' });
    }
  }

  const allowedFields = ['title', 'description', 'type', 'category', 'week', 'fileUrl', 'isPublished'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (updates.type && !ALLOWED_TYPES.includes(updates.type)) updates.type = 'other';

  resource = await Resource.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('course', 'title courseCode');

  res.status(200).json({ success: true, data: resource });
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Teacher/Admin)
exports.deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  // Check authorization (only uploader or admin)
  if (req.user.role !== 'admin' && resource.uploadedBy.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this resource' });
  }

  await resource.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Resource deleted'
  });
});
