const axios = require('axios');

async function testAll() {
  const baseURL = 'http://localhost:5051/api';
  console.log('Testing Backend API...');

  try {
    // 1. Test Auth (Login)
    console.log('\n--- 1. Testing Auth ---');
    const loginRes = await axios.post(`${baseURL}/users/login`, {
      email: 'student@lms.com',
      password: 'password123'
    });
    console.log('Login Success:', loginRes.data.success);
    const token = loginRes.data.data.token;

    const authConfig = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Test Courses
    console.log('\n--- 2. Testing Courses ---');
    const coursesRes = await axios.get(`${baseURL}/courses`, authConfig);
    console.log('Courses fetched:', coursesRes.data.data.courses.length);

    // 3. Test Enrollments
    console.log('\n--- 3. Testing Enrollments ---');
    const enrollRes = await axios.get(`${baseURL}/enrollments/my-enrollments`, authConfig);
    console.log('Enrollments fetched:', enrollRes.data.data.enrollments.length);

    // 4. Test Exams
    console.log('\n--- 4. Testing Exams ---');
    const examsRes = await axios.get(`${baseURL}/exams/my-exams`, authConfig);
    console.log('Exams fetched:', examsRes.data.success);

    // 5. Test Resources
    console.log('\n--- 5. Testing Resources ---');
    const resRes = await axios.get(`${baseURL}/resources/my-resources`, authConfig);
    console.log('Resources fetched:', resRes.data.success);

    console.log('\n✅ ALL MODULES ARE WORKING PERFECTLY!');
  } catch (error) {
    console.error('\n❌ ERROR FOUND:', error.response ? error.response.data : error.message);
  }
}

testAll();
