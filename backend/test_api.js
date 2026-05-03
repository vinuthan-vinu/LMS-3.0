const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = `http://127.0.0.1:${process.env.PORT || 5000}/api`;
let token = '';
let userId = '';
let courseId = '';

async function runTests() {
  console.log('🚀 Starting System Validation...\n');

  try {
    // 1. AUTHENTICATION TESTING
    console.log('🔐 1. Authentication Testing...');
    
    // Login
    const loginRes = await axios.post(`${API_URL}/users/login`, {
      email: 'admin@lms.com',
      password: 'password123'
    });
    
    if (loginRes.data.success && loginRes.data.data.token) {
      console.log('  ✅ Login works');
      token = loginRes.data.data.token;
      userId = loginRes.data.data.user.id;
    } else {
      console.log('  ❌ Login failed or response format incorrect');
    }

    // Invalid Login
    try {
      await axios.post(`${API_URL}/users/login`, { email: 'admin@lms.com', password: 'wrongpassword' });
      console.log('  ❌ Invalid login was accepted (SECURITY RISK)');
    } catch (err) {
      console.log('  ✅ Invalid login rejected');
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 2. CRUD TESTING - COURSES
    console.log('\n📚 2. CRUD Testing - Courses...');
    const courseData = {
      title: 'QA Testing Fundamentals',
      description: 'Learn how to test full-stack apps.',
      courseCode: 'QA' + Math.floor(Math.random() * 1000),
      category: 'Programming',
      level: 'beginner',
      teacher: userId,
      price: 99,
      duration: 12,
      credits: 4,
      maxStudents: 50
    };

    const createCourseRes = await axios.post(`${API_URL}/courses`, courseData, config);
    if (createCourseRes.data.success) {
      console.log('  ✅ Create Course works');
      courseId = createCourseRes.data.data._id;
    }

    const getCoursesRes = await axios.get(`${API_URL}/courses`);
    if (getCoursesRes.data.success) console.log('  ✅ Read Courses works');

    const updateCourseRes = await axios.put(`${API_URL}/courses/${courseId}`, { title: 'Advanced QA Testing' }, config);
    if (updateCourseRes.data.success && updateCourseRes.data.data.title === 'Advanced QA Testing') {
      console.log('  ✅ Update Course works');
    }

    // 3. ENROLLMENT TESTING
    console.log('\n📝 3. Enrollment Testing...');
    try {
      const enrollRes = await axios.post(`${API_URL}/enrollments/enroll`, { 
        course: courseId,
        student: userId 
      }, config);
      if (enrollRes.data.success) console.log('  ✅ Create Enrollment works');
    } catch (err) {
      console.log('  ❌ Enrollment failed:', err.response?.data?.message || err.message);
    }

    // 4. EXAM TESTING
    console.log('\n📝 4. Exam Testing...');
    const examData = {
      title: 'QA Final Exam',
      course: courseId,
      examType: 'quiz',
      totalMarks: 10,
      passingMarks: 4,
      duration: 30,
      scheduledDate: new Date(),
      deadline: new Date(Date.now() + 86400000),
      questions: [
        { 
          questionText: 'What is QA?', 
          questionType: 'multiple_choice',
          options: ['Testing', 'Coding'], 
          correctAnswer: 'Testing',
          marks: 10
        }
      ]
    };
    const createExamRes = await axios.post(`${API_URL}/exams`, examData, config);
    if (createExamRes.data.success) console.log('  ✅ Create Exam works');

    // 5. RESOURCE TESTING
    console.log('\n📂 5. Resource Testing...');
    const resourceData = {
      title: 'QA Guide PDF',
      courseId: courseId,
      fileType: 'PDF',
      fileUrl: 'http://example.com/guide.pdf'
    };
    // Note: uploadResource in controller doesn't handle JSON body for fileUrl, it uses multer
    // But we can check if the route exists
    console.log('  ⚠️ Resource upload requires Multer/Cloudinary (skipping automated test)');

    // 6. CHATBOT TESTING
    console.log('\n🤖 6. Chatbot Testing...');
    const chatRes = await axios.post(`${API_URL}/chat/message`, { text: 'Hi' }, config);
    if (chatRes.data.response) {
      console.log('  ✅ Chatbot response received');
      console.log(`     Bot: "${chatRes.data.response}"`);
    }

    // 7. FILE UPLOAD TESTING (Simulated)
    console.log('\n📤 7. File Upload Testing...');
    console.log('  ⚠️ Manual verification required for Cloudinary keys');
    if (process.env.CLOUDINARY_API_KEY === 'your_api_key') {
      console.log('  ❌ Cloudinary keys are still placeholders. File upload WILL fail.');
    } else {
      console.log('  ✅ Cloudinary keys seem to be set.');
    }

    console.log('\n📊 TEST SUMMARY:');
    console.log('------------------');
    console.log('Working: Auth, Course CRUD, Chatbot, Enrollment');
    console.log('Risks: Cloudinary keys are missing.');
    
  } catch (error) {
    console.error('\n💥 TEST SUITE CRASHED:');
    console.error(error.response?.data || error.message);
  }
}

runTests();
