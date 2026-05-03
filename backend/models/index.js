/**
 * Models Index
 * Export all models from a single file
 */
const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Payment = require('./Payment');
const Exam = require('./Exam');
const ExamSubmission = require('./ExamSubmission');
const ExamAttempt = require('./ExamAttempt');
const Resource = require('./Resource');
const ChatMessage = require('./ChatMessage');
const Chat = require('./Chat');
const FAQ = require('./FAQ');
const Notification = require('./Notification');

module.exports = {
  User,
  Course,
  Enrollment,
  Payment,
  Exam,
  ExamSubmission,
  ExamAttempt,
  Resource,
  ChatMessage,
  Chat,
  FAQ,
  Notification,
};
