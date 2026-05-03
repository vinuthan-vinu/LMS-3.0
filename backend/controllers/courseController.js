/**
 * Course Controller
 * Handles CRUD operations for courses
 */
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/error');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = asyncHandler(async (req, res) => {
  const { category, level, status, teacher, search, page = 1, limit = 10 } = req.query;

  // Build query
  const query = {};

  if (category) query.category = category;
  if (level) query.level = level;
  if (status) query.status = status;
  if (teacher) query.teacher = teacher;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { courseCode: { $regex: search, $options: 'i' } },
    ];
  }

  // Only show published courses to non-admin users (req.user may be null for public routes)
  if (!req.user || req.user.role !== 'admin') {
    query.status = 'published';
  }

  const courses = await Course.find(query)
    .populate('teacher', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Course.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      courses,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    },
  });
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('teacher', 'firstName lastName email avatar bio');

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin/Teacher)
const createCourse = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    req.body.teacher = req.user.id;
  }

  // Verify teacher exists
  if (req.body.teacher) {
    const teacher = await User.findById(req.body.teacher);
    console.log('Validating Teacher:', { id: req.body.teacher, found: !!teacher, role: teacher?.role });
    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID',
      });
    }
  }

  if (req.file) {
    req.body.thumbnail = `/uploads/${req.file.filename}`;
  }
  if (req.body.teacher) {
    const teacher = await User.findById(req.body.teacher);
    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID',
      });
    }
  }
  if (typeof req.body.schedule === 'string') {
    try { req.body.schedule = JSON.parse(req.body.schedule); } catch(e) {}
  }
  if (typeof req.body.syllabus === 'string') {
    try { req.body.syllabus = JSON.parse(req.body.syllabus); } catch(e) {}
  }

  const course = await Course.create(req.body);

  if (course.status === 'published') {
    await Notification.create({
      title: 'New Course Schedule 📅',
      message: `"${course.title}" has been published with its timetable.`,
      type: 'class_update',
      audience: 'students',
      course: course._id,
      sender: req.user.id,
    }).catch(() => {});
  }

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course,
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin/Teacher who created it)
const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  // Check authorization
  if (req.user.role !== 'admin' && course.teacher.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this course',
    });
  }

  if (req.file) {
    req.body.thumbnail = `/uploads/${req.file.filename}`;
  }
  if (typeof req.body.schedule === 'string') {
    try { req.body.schedule = JSON.parse(req.body.schedule); } catch(e) {}
  }
  if (typeof req.body.syllabus === 'string') {
    try { req.body.syllabus = JSON.parse(req.body.syllabus); } catch(e) {}
  }

  const oldScheduleStr = JSON.stringify(course.schedule || {});
  
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  const newScheduleStr = JSON.stringify(course.schedule || {});
  if (oldScheduleStr !== newScheduleStr) {
    // Notify students
    await Notification.create({
      title: 'Class Schedule Updated 📅',
      message: `The schedule for "${course.title}" has been updated.`,
      type: 'class_update',
      audience: 'students',
      course: course._id,
      sender: req.user.id,
    }).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: course,
  });
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  // Only admins can delete courses
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete courses',
    });
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
});

// @desc    Get courses by teacher
// @route   GET /api/courses/teacher/:teacherId
// @access  Public
const getCoursesByTeacher = asyncHandler(async (req, res) => {
  const courses = await Course.find({ teacher: req.params.teacherId, status: 'published' })
    .populate('teacher', 'firstName lastName email');

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

// @desc    Enroll student in course (increment count)
// @route   POST /api/courses/:id/enroll
// @access  Private
const enrollStudent = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found',
    });
  }

  if (course.enrolledStudents >= course.maxStudents) {
    return res.status(400).json({
      success: false,
      message: 'Course is full',
    });
  }

  course.enrolledStudents += 1;
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Student enrolled successfully',
    data: { enrolledStudents: course.enrolledStudents },
  });
});

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByTeacher,
  enrollStudent,
};
