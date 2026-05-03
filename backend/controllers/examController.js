const crypto = require('crypto');
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ExamSubmission = require('../models/ExamSubmission');
const ExamAttempt = require('../models/ExamAttempt');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/error');

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Teacher/Admin)
exports.createExam = asyncHandler(async (req, res) => {
  const courseDoc = await Course.findById(req.body.course).select('title teacher');
  if (!courseDoc) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (req.user.role === 'teacher' && courseDoc.teacher.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to create exams for this course' });
  }

  // Auto-set examType if not provided
  if (!req.body.examType) {
    req.body.examType = 'quiz';
  }
  // Auto-set isPublished to true
  if (req.body.isPublished === undefined) {
    req.body.isPublished = true;
  }

  if (Array.isArray(req.body.questions)) {
    req.body.questions = req.body.questions.map((question) => ({
      ...question,
      questionType: question.questionType || (Array.isArray(question.options) && question.options.length > 0 ? 'multiple_choice' : 'short_answer'),
      options: Array.isArray(question.options) ? question.options.filter(Boolean) : [],
    }));
  }

  const exam = await (await Exam.create(req.body)).populate('course', 'title courseCode');

  // Notify students
  if (courseDoc && req.body.isPublished !== false) {
    await Notification.create({
      title: 'New Exam Scheduled 📝',
      message: `A new exam "${exam.title}" has been scheduled for "${courseDoc.title}".`,
      type: 'exam_update',
      audience: 'students',
      course: exam.course,
      sender: req.user.id,
    }).catch(() => {});
  }

  res.status(201).json({
    success: true,
    data: exam
  });
});

// @desc    Start an exam attempt
// @route   POST /api/exams/start
// @access  Private (Student)
exports.startExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;

  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  const previousSubmissions = await ExamSubmission.countDocuments({
    student: req.user.id,
    exam: examId,
    status: { $in: ['submitted', 'graded'] },
  });

  if (!exam.allowRetake && previousSubmissions > 0) {
    return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
  }

  if (exam.allowRetake && previousSubmissions >= (exam.maxAttempts || 1)) {
    return res.status(400).json({ success: false, message: 'Maximum exam attempts reached' });
  }

  // Approved enrollment required
  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: exam.course,
    status: 'approved',
  });
  if (!enrollment) {
    return res.status(403).json({
      success: false,
      message: 'You need an approved enrollment in this course to take this exam',
    });
  }

  // Check for existing ongoing attempt
  let attempt = await ExamAttempt.findOne({ student: req.user.id, exam: examId, status: 'ongoing' });
  if (!attempt) {
    attempt = await ExamAttempt.create({
      student: req.user.id,
      exam: examId,
      startTime: new Date(),
      status: 'ongoing'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      attemptId: attempt._id,
      startTime: attempt.startTime,
      duration: exam.duration,
      exam: {
        _id: exam._id,
        title: exam.title,
        questions: exam.questions,
        totalMarks: exam.totalMarks,
        duration: exam.duration
      }
    }
  });
});

// @desc    Get exams by course
// @route   GET /api/exams/course/:courseId
// @access  Private
exports.getExamsByCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const course = await Course.findById(courseId).select('teacher');
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const { role, id } = req.user;
  if (role === 'admin') {
    /* ok */
  } else if (role === 'teacher') {
    if (course.teacher.toString() !== id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }
  } else {
    const enr = await Enrollment.findOne({
      student: id,
      course: courseId,
      status: 'approved',
    });
    if (!enr) {
      return res.status(403).json({ success: false, message: 'Not authorized to view exams for this course' });
    }
  }

  const exams = await Exam.find({ course: courseId });
  res.status(200).json({
    success: true,
    count: exams.length,
    data: exams
  });
});

// @desc    Get exams for enrolled courses (Student)
// @route   GET /api/exams/my-exams
// @access  Private
exports.getMyExams = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const exams = await Exam.find({ isPublished: true })
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  }

  if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    const exams = await Exam.find({ course: { $in: courses.map((course) => course._id) } })
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  }

  // Find all courses the student is enrolled in
  const enrollments = await Enrollment.find({ student: req.user.id, status: 'approved' });
  const courseIds = enrollments.map(e => e.course);

  // Find published exams for those courses
  const exams = await Exam.find({ course: { $in: courseIds }, isPublished: true })
    .populate('course', 'title courseCode');

  res.status(200).json({
    success: true,
    count: exams.length,
    data: exams
  });
});

// @desc    Get student's exam results
// @route   GET /api/exams/my-results
// @access  Private
exports.getResults = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const submissions = await ExamSubmission.find({ status: 'graded' })
      .populate('student', 'firstName lastName email')
      .populate({
        path: 'exam',
        select: 'title totalMarks passingMarks course',
        populate: { path: 'course', select: 'title courseCode' }
      })
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  }

  if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    const exams = await Exam.find({ course: { $in: courses.map((course) => course._id) } }).select('_id');
    const submissions = await ExamSubmission.find({ exam: { $in: exams.map((exam) => exam._id) }, status: 'graded' })
      .populate('student', 'firstName lastName email')
      .populate({
        path: 'exam',
        select: 'title totalMarks passingMarks course',
        populate: { path: 'course', select: 'title courseCode' }
      })
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  }

  const submissions = await ExamSubmission.find({ student: req.user.id, status: 'graded' })
    .populate({
      path: 'exam',
      select: 'title totalMarks passingMarks course',
      populate: { path: 'course', select: 'title courseCode' }
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions
  });
});

// @desc    Submit exam
// @route   POST /api/exams/submit
// @access  Private (Student)
exports.submitExam = asyncHandler(async (req, res) => {
  const { examId, answers, enrollmentId } = req.body;

  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  // Validate timing
  const attempt = await ExamAttempt.findOne({ student: req.user.id, exam: examId, status: 'ongoing' });
  if (!attempt) {
    return res.status(400).json({ success: false, message: 'No active exam attempt found. Please start the exam first.' });
  }

  const priorSubmissions = await ExamSubmission.countDocuments({
    student: req.user.id,
    exam: examId,
    status: { $in: ['submitted', 'graded'] },
  });

  if (!exam.allowRetake && priorSubmissions > 0) {
    attempt.status = 'submitted';
    await attempt.save();
    return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
  }

  if (exam.allowRetake && priorSubmissions >= (exam.maxAttempts || 1)) {
    attempt.status = 'submitted';
    await attempt.save();
    return res.status(400).json({ success: false, message: 'Maximum exam attempts reached' });
  }

  const elapsedMinutes = (Date.now() - new Date(attempt.startTime).getTime()) / (1000 * 60);
  // 2 minute grace period for network lag
  if (elapsedMinutes > exam.duration + 2) {
    attempt.status = 'expired';
    await attempt.save();
    return res.status(403).json({ success: false, message: 'Exam time has expired' });
  }

  // Grade each question in exam order (matches by questionId when present, else by index)
  const answerPayload = answers || [];
  let totalMarksObtained = 0;
  const processedAnswers = (exam.questions || []).map((question, idx) => {
    const byId =
      question._id &&
      answerPayload.find(
        (a) => a.questionId && String(a.questionId) === String(question._id)
      );
    const byIndex = answerPayload[idx];
    const answer = byId || byIndex || {};
    const studentAnswer =
      answer.studentAnswer !== undefined && answer.studentAnswer !== null
        ? String(answer.studentAnswer).trim()
        : '';
    const canonical = question.correctAnswer != null ? String(question.correctAnswer).trim() : '';
    const isCorrect = studentAnswer === canonical;
    const marks = isCorrect ? Number(question.marks) || 1 : 0;
    totalMarksObtained += marks;
    const stableFallbackId =
      question._id ||
      new mongoose.Types.ObjectId(
        crypto
          .createHash('sha1')
          .update(`${exam._id}_${idx}_${String(question.questionText || '')}`)
          .digest('hex')
          .slice(0, 24)
      );

    return {
      questionId: stableFallbackId,
      studentAnswer,
      isCorrect,
      marksObtained: marks,
    };
  });

  // Calculate percentage and grade
  const percentage = exam.totalMarks > 0 ? (totalMarksObtained / exam.totalMarks) * 100 : 0;
  const isPassed = totalMarksObtained >= (exam.passingMarks || 0);

  let grade;
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else grade = 'F';

  // Resolve enrollmentId
  let resolvedEnrollmentId = enrollmentId;
  if (!resolvedEnrollmentId) {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: exam.course,
      status: 'approved',
    });
    resolvedEnrollmentId = enrollment?._id;
  }

  const submission = await ExamSubmission.create({
    exam: examId,
    student: req.user.id,
    enrollment: resolvedEnrollmentId,
    answers: processedAnswers,
    totalMarksObtained,
    percentage,
    grade,
    isPassed,
    startedAt: attempt.startTime,
    submittedAt: new Date(),
    timeSpent: Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000),
    status: 'graded'
  });

  // Close the attempt
  attempt.status = 'submitted';
  attempt.submitTime = new Date();
  attempt.score = totalMarksObtained;
  await attempt.save();

  // Auto-notify student about their result
  await Notification.create({
    title: isPassed ? 'Exam Passed 🎉' : 'Exam Result 📊',
    message: `You scored ${percentage.toFixed(0)}% (${grade}) on "${exam.title}". ${isPassed ? 'Congratulations!' : 'Keep studying!'}`,
    type: 'exam_update',
    audience: 'specific_user',
    recipient: req.user.id,
    sender: req.user.id,
  }).catch(() => {}); // non-critical

  res.status(201).json({
    success: true,
    data: submission
  });
});

// @desc    Get ALL student results (Admin)
// @route   GET /api/exams/all-results
// @access  Private (Admin)
exports.getAllResults = asyncHandler(async (req, res) => {
  let examFilter = {};

  if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    const exams = await Exam.find({ course: { $in: courses.map((course) => course._id) } }).select('_id');
    examFilter = { exam: { $in: exams.map((exam) => exam._id) } };
  }

  const submissions = await ExamSubmission.find({ status: 'graded', ...examFilter })
    .populate('student', 'firstName lastName email')
    .populate({
      path: 'exam',
      select: 'title totalMarks passingMarks course duration',
      populate: { path: 'course', select: 'title courseCode' }
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions
  });
});

// @desc    Get all exams (Admin)
// @route   GET /api/exams/all
// @access  Private (Admin)
exports.getAllExams = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === 'teacher') {
    const courses = await Course.find({ teacher: req.user.id }).select('_id');
    query = { course: { $in: courses.map((course) => course._id) } };
  }

  const exams = await Exam.find(query)
    .populate('course', 'title courseCode')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: exams.length,
    data: exams
  });
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin)
exports.deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  if (req.user.role === 'teacher') {
    const ownsCourse = await Course.exists({ _id: exam.course, teacher: req.user.id });
    if (!ownsCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this exam' });
    }
  }

  await exam.deleteOne();
  res.status(200).json({ success: true, message: 'Exam deleted' });
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Teacher/Admin)
exports.updateExam = asyncHandler(async (req, res) => {
  let exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  if (req.user.role === 'teacher') {
    const ownsCourse = await Course.exists({ _id: exam.course, teacher: req.user.id });
    if (!ownsCourse) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this exam' });
    }
  }

  const allowedFields = [
    'title',
    'description',
    'examType',
    'instructions',
    'questions',
    'totalMarks',
    'passingMarks',
    'duration',
    'scheduledDate',
    'deadline',
    'isPublished',
    'allowRetake',
    'maxAttempts',
    'showResults',
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Array.isArray(updates.questions)) {
    updates.questions = updates.questions.map((question) => ({
      ...question,
      questionType: question.questionType || (Array.isArray(question.options) && question.options.length > 0 ? 'multiple_choice' : 'short_answer'),
      options: Array.isArray(question.options) ? question.options.filter(Boolean) : [],
    }));
  }

  exam = await Exam.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('course', 'title courseCode');

  res.status(200).json({ success: true, data: exam });
});
