const express = require('express');
const router = express.Router();
const { handleChat, getChatHistory, getAllChats, clearChat, deleteChatLog } = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiters');

router.post('/message', protect, messageLimiter, handleChat);
router.get('/history', protect, getChatHistory);
router.delete('/clear', protect, clearChat);

// Admin routes
router.get('/admin/logs', protect, authorize('admin'), getAllChats);
router.delete('/admin/logs/:id', protect, authorize('admin'), deleteChatLog);

module.exports = router;
