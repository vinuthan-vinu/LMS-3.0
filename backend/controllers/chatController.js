const Chat = require('../models/Chat');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

// Comprehensive keyword-response map for LMS Assistant
const BOT_RESPONSES = [
  // Greetings
  { keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    response: '👋 Hello! I\'m your LMS Assistant. I can help you with courses, exams, payments, schedules, and more. What do you need help with?' },

  // Course related
  { keywords: ['course', 'courses', 'subject', 'module', 'class'],
    response: '📚 You can browse all available courses in the **Courses** tab at the bottom. Use the search bar to find specific courses. To enroll, tap the "Enroll Now" button on any course card.\n\n💡 **Tip:** You can also type **"list courses"** to see available courses, or type **"enroll me in [course name]"** to enroll directly!' },

  { keywords: ['enroll', 'enrollment', 'register course', 'join course', 'sign up course'],
    response: '✅ To enroll in a course:\n1. Go to the **Courses** tab\n2. Find the course you want\n3. Tap **"Enroll Now"**\n4. Upload your payment proof\n5. Wait for admin approval\n\n💡 **Quick enroll:** Type **"enroll me in [course name]"** and I\'ll submit the request for you!' },

  // Payment
  { keywords: ['payment', 'pay', 'fee', 'money', 'price', 'cost', 'receipt'],
    response: '💰 To make a payment:\n1. Go to **Payments** screen\n2. Tap **"Upload Payment Proof"**\n3. Select your receipt/screenshot\n4. Wait for admin to verify\n\nYou can check your payment status anytime — it will show "Pending" or "Verified".' },

  // Exams
  { keywords: ['exam', 'test', 'quiz', 'assessment', 'mcq'],
    response: '📝 About Exams:\n• Go to the **Exams** screen to see available exams\n• Tap **"Start Exam"** — a countdown timer will begin\n• Select your answers for each question\n• Submit before time runs out (it auto-submits at 0!)\n• View your results with grade and percentage in the Results tab.' },

  { keywords: ['result', 'score', 'grade', 'marks', 'pass', 'fail'],
    response: '📊 To view your exam results:\n• Go to **Exams** screen\n• Tap the **"Results"** tab\n• You\'ll see your percentage, grade (A+ to F), and pass/fail status for each exam.' },

  // Schedule & Timetable
  { keywords: ['schedule', 'timetable', 'time table', 'timing', 'class time', 'when is'],
    response: '📅 Your class timetable is available via the **calendar icon** (floating button) on the Dashboard. It shows your classes organized by day (Mon-Sun) with start and end times.' },

  { keywords: ['live class', 'online class', 'video class', 'zoom', 'meet', 'join class'],
    response: '🎥 To join a live class:\n1. Tap the **calendar icon** on your Dashboard\n2. Find your class for today\n3. Tap **"Join Live Class"**\n4. It will open Google Meet in your browser.' },

  // Resources
  { keywords: ['resource', 'pdf', 'notes', 'download', 'material', 'study', 'video lesson', 'document'],
    response: '📖 Study resources are in the **Resources** tab:\n• Filter by **All**, **PDFs**, or **Videos**\n• Tap any resource to download/open it\n• Resources are uploaded by your course teachers.' },

  // Notifications
  { keywords: ['notification', 'announcement', 'alert', 'update', 'news'],
    response: '🔔 Notifications appear when you tap the **bell icon** on your Dashboard. Admins and teachers send announcements about classes, exams, and important updates.' },

  // Profile & Account
  { keywords: ['profile', 'account', 'my info', 'edit profile', 'change password'],
    response: '👤 Your profile is in the **Profile** tab (bottom right). You can view your name, email, role, and enrollment count. Use the **Sign Out** button to logout securely.' },

  { keywords: ['logout', 'log out', 'sign out', 'exit'],
    response: '🚪 To logout: Go to the **Profile** tab → Tap **"Sign Out"** → Confirm. Your session will end securely.' },

  { keywords: ['password', 'forgot', 'reset'],
    response: '🔑 If you forgot your password, please contact your admin at admin@lms.com to reset it. Password reset via email is coming in a future update.' },

  // Admin
  { keywords: ['admin', 'teacher', 'instructor'],
    response: '👨‍💼 Admins can manage users, courses, payments, exams, and notifications from the **Admin Dashboard**. Teachers can create exams and upload resources for their courses.' },

  // Technical help
  { keywords: ['error', 'bug', 'not working', 'problem', 'issue', 'crash', 'stuck'],
    response: '🔧 If you\'re experiencing issues:\n1. Try refreshing the page\n2. Check your internet connection\n3. Try logging out and back in\n4. If the problem persists, contact support at admin@lms.com' },

  // Help
  { keywords: ['help', 'what can you do', 'features', 'how to use'],
    response: '🤖 I can help you with:\n• 📚 **Courses** — browsing & enrolling\n• 💰 **Payments** — uploading proof & checking status\n• 📝 **Exams** — taking exams & viewing results\n• 📅 **Timetable** — class schedules\n• 📖 **Resources** — study materials\n• 🔔 **Notifications** — announcements\n• 👤 **Profile** — account info\n\n💡 **Smart commands:**\n• Type **"list courses"** — see available courses\n• Type **"enroll me in [course name]"** — enroll directly\n• Type **"ask teacher: [question]"** — send an academic question to teachers\n• Type **"ask admin: [question]"** — send a question to admin\n\nJust type your question!' },

  // Thank you
  { keywords: ['thank', 'thanks', 'thank you', 'great', 'awesome', 'nice'],
    response: '😊 You\'re welcome! Happy to help. If you have more questions, just ask anytime!' },

  // Bye
  { keywords: ['bye', 'goodbye', 'see you', 'later'],
    response: '👋 Goodbye! Good luck with your studies. Come back anytime you need help!' },
];

const getStaticResponse = (text) => {
  const lowerText = text.toLowerCase().trim();
  for (const item of BOT_RESPONSES) {
    if (item.keywords.some(keyword => lowerText.includes(keyword))) {
      return item.response;
    }
  }
  return null;
};

exports.handleChat = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Message text is required' });
    }

    let chat = await Chat.findOne({ user: userId });
    if (!chat) {
      chat = await Chat.create({ user: userId, messages: [] });
    }

    const lowerText = text.toLowerCase().trim();
    let botResponse;

    // --- Dynamic: "list courses" ---
    if (lowerText.includes('list courses') || lowerText.includes('show courses') || lowerText.includes('available courses')) {
      const courses = await Course.find({ status: 'published' }).select('title courseCode price category').limit(10);
      if (courses.length === 0) {
        botResponse = '📚 No courses are currently available. Please check back later!';
      } else {
        const list = courses.map((c, i) => `${i + 1}. **${c.title}** (${c.courseCode}) — $${c.price || 0} · ${c.category || 'General'}`).join('\n');
        botResponse = `📚 **Available Courses:**\n${list}\n\n💡 To enroll, type **"enroll me in [course name]"**`;
      }
    }
    // --- Dynamic: "enroll me in ..." ---
    else if (lowerText.includes('enroll me in') || lowerText.includes('enroll me for') || lowerText.includes('register me for') || lowerText.includes('sign me up for')) {
      const courseName = text.replace(/enroll me (in|for)|register me for|sign me up for/gi, '').trim();
      if (!courseName) {
        botResponse = '❓ Please specify the course name. Example: **"enroll me in Web Development"**';
      } else {
        const course = await Course.findOne({
          $or: [
            { title: { $regex: courseName, $options: 'i' } },
            { courseCode: { $regex: courseName, $options: 'i' } }
          ],
          status: 'published'
        });
        if (!course) {
          botResponse = `❌ I couldn't find a course matching **"${courseName}"**. Type **"list courses"** to see available options.`;
        } else {
          const existing = await Enrollment.findOne({ student: userId, course: course._id });
          if (existing) {
            botResponse = `⚠️ You are already enrolled in **${course.title}** (status: ${existing.status}). Check your Dashboard for details.`;
          } else {
            await Enrollment.create({
              student: userId,
              course: course._id,
              status: 'pending',
            });
            course.enrolledStudents = (course.enrolledStudents || 0) + 1;
            await course.save();
            await Notification.create({
              title: 'New Enrollment Request',
              message: `A student requested enrollment in "${course.title}" through the chatbot.`,
              type: 'system',
              audience: 'admins',
              course: course._id,
              sender: userId,
            }).catch(() => {});
            botResponse = `✅ **Enrollment request submitted!**\n\n📚 Course: **${course.title}** (${course.courseCode})\n💰 Fee: $${course.price || 0}\n📋 Status: **Pending** — waiting for admin approval.\n\n💡 Go to **Payments** to upload your payment proof for faster approval!`;
          }
        }
      }
    }
    // --- Dynamic: "ask teacher" or "academic question" ---
    else if (lowerText.startsWith('ask teacher:') || lowerText.startsWith('ask admin:')) {
      const question = text.split(':').slice(1).join(':').trim();
      if (!question) {
        botResponse = '❓ Please type your question after the colon. Example: **"ask teacher: When is the next exam?"**';
      } else {
        await Notification.create({
          title: 'New Academic Question 🙋',
          message: `Question from a student:\n"${question}"`,
          type: 'system',
          audience: lowerText.startsWith('ask admin') ? 'admins' : 'teachers',
          sender: userId,
        }).catch(() => {});
        botResponse = `✅ Your question has been forwarded to the ${lowerText.startsWith('ask admin') ? 'admin' : 'teachers'}. They will get back to you soon.`;
      }
    }
    // --- Static keyword matching ---
    else {
      botResponse = getStaticResponse(text) || '🤔 I\'m not sure I understand that. Try asking about:\n• **courses** — browse & enroll\n• **exams** — take tests & see results\n• **payment** — upload proof\n• **schedule** — class timetable\n• **resources** — study materials\n• **help** — see all features\n\nOr type **"help"** to see everything I can do!';
    }

    chat.messages.push({ sender: 'User', text });
    chat.messages.push({ sender: 'Bot', text: botResponse });

    await chat.save();
    res.json({ success: true, response: botResponse, data: chat.messages, history: chat.messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user.id });
    if (!chat) return res.status(200).json({ success: true, data: [] });
    res.json({ success: true, data: chat.messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearChat = async (req, res) => {
  try {
    await Chat.findOneAndDelete({ user: req.user.id });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find().populate('user', 'firstName lastName email role').sort('-updatedAt');
    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteChatLog = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat log not found' });
    }
    await chat.deleteOne();
    res.json({ success: true, message: 'Chat log deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
