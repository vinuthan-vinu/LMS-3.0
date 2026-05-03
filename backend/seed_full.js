const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load models
const User = require('./models/User');
const Course = require('./models/Course');
const Resource = require('./models/Resource');
const Exam = require('./models/Exam');
const Enrollment = require('./models/Enrollment');
const ExamSubmission = require('./models/ExamSubmission');
const Payment = require('./models/Payment');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // 1. Clear existing data
    await User.deleteMany();
    await Course.deleteMany();
    await Resource.deleteMany();
    await Exam.deleteMany();
    await Enrollment.deleteMany();
    await ExamSubmission.deleteMany();
    await Payment.deleteMany();
    console.log('Database cleared.');

    // 2. Create Users
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const users = await User.create([
      { firstName: 'Admin', lastName: 'User', email: 'admin@lms.com', password, role: 'admin' },
      { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@university.edu', password, role: 'teacher' },
      { firstName: 'Adam', lastName: 'Smith', email: 'adam.s@university.edu', password, role: 'teacher' },
      { firstName: 'Vinuthan', lastName: 'Student', email: 'student@lms.com', password, role: 'student' },
      { firstName: 'Alex', lastName: 'Thompson', email: 'alex.t@university.edu', password, role: 'student' },
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria.g@university.edu', password, role: 'student' }
    ]);

    const adminId = users[0]._id;
    const teacher1Id = users[1]._id;
    const teacher2Id = users[2]._id;
    const student1Id = users[3]._id;
    const student2Id = users[4]._id;

    console.log('Users created.');

    // 3. Create Courses
    const courses = await Course.create([
      {
        title: 'Advanced React Development',
        courseCode: 'CS 401',
        description: 'Master hooks, context, and performance optimization in React.',
        category: 'Programming',
        level: 'advanced',
        price: 299,
        credits: 4,
        duration: 12,
        maxStudents: 50,
        status: 'published',
        teacher: teacher1Id,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500'
      },
      {
        title: 'UI/UX Design Fundamentals',
        courseCode: 'DSGN 101',
        description: 'Learn Figma, prototyping, and user-centered design principles.',
        category: 'Design',
        level: 'beginner',
        price: 199,
        credits: 3,
        duration: 8,
        maxStudents: 30,
        status: 'published',
        teacher: teacher2Id,
        thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=500'
      },
      {
        title: 'Business Data Analysis',
        courseCode: 'BUS 205',
        description: 'Using Excel and Python for business decision making.',
        category: 'Business',
        level: 'intermediate',
        price: 399,
        credits: 3,
        duration: 10,
        maxStudents: 40,
        status: 'published',
        teacher: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500'
      },
      {
        title: 'Quantum Physics for Beginners',
        courseCode: 'SCI 302',
        description: 'Explore the mysteries of the subatomic world.',
        category: 'Science',
        level: 'intermediate',
        price: 450,
        credits: 4,
        duration: 14,
        maxStudents: 25,
        status: 'published',
        teacher: teacher1Id,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500'
      },
      {
        title: 'Modern Abstract Art',
        courseCode: 'ARTS 105',
        description: 'Techniques and history of abstract expressionism.',
        category: 'Arts',
        level: 'beginner',
        price: 150,
        credits: 2,
        duration: 6,
        maxStudents: 20,
        status: 'published',
        teacher: teacher2Id,
        thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500'
      }
    ]);

    console.log('Courses created.');

    // 4. Create Resources
    await Resource.create([
      { title: 'React Hooks Deep Dive', course: courses[0]._id, type: 'pdf', category: 'reading', fileName: 'react_hooks.pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileSize: 1200000, uploadedBy: teacher1Id, isPublished: true },
      { title: 'Designing for Mobile', course: courses[1]._id, type: 'video', category: 'lecture', fileName: 'mobile_design.mp4', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileSize: 45000000, uploadedBy: teacher2Id, isPublished: true },
      { title: 'Python for Data Analysis', course: courses[2]._id, type: 'pdf', category: 'reference', fileName: 'python_data.pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileSize: 2500000, uploadedBy: adminId, isPublished: true },
      { title: 'Quantum Mechanics Overview', course: courses[3]._id, type: 'pdf', category: 'lecture', fileName: 'quantum.pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileSize: 1800000, uploadedBy: teacher1Id, isPublished: true }
    ]);

    console.log('Resources created.');

    // 5. Create Exams
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    const deadline = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000); // 8 days later

    const exams = await Exam.create([
      { 
        title: 'React Performance Quiz', 
        course: courses[0]._id, 
        examType: 'quiz', 
        duration: 30, 
        totalMarks: 50, 
        passingMarks: 20, 
        scheduledDate, 
        deadline,
        isPublished: true,
        questions: [{ 
          questionText: 'What is useMemo used for?', 
          questionType: 'multiple_choice',
          options: ['Styling', 'Memoizing values', 'Routing', 'API calls'], 
          correctAnswer: 'Memoizing values', 
          marks: 10 
        }]
      },
      { 
        title: 'Design Principles Midterm', 
        course: courses[1]._id, 
        examType: 'midterm', 
        duration: 60, 
        totalMarks: 100, 
        passingMarks: 40, 
        scheduledDate, 
        deadline,
        isPublished: true,
        questions: [{ 
          questionText: 'What does UX stand for?', 
          questionType: 'multiple_choice',
          options: ['User Experience', 'User Xylophone', 'Universal X-ray', 'Union Extra'], 
          correctAnswer: 'User Experience', 
          marks: 10 
        }]
      }
    ]);

    console.log('Exams created.');

    // 6. Create Enrollments
    const enrollments = await Enrollment.create([
      { student: student1Id, course: courses[0]._id, status: 'approved' },
      { student: student1Id, course: courses[1]._id, status: 'approved' },
      { student: student1Id, course: courses[2]._id, status: 'approved' }
    ]);

    console.log('Enrollments created.');

    // 7. Create Payments
    await Payment.create([
      { student: student1Id, course: courses[0]._id, enrollment: enrollments[0]._id, amount: 299, paymentMethod: 'credit_card', paymentProof: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', status: 'verified', verifiedBy: adminId, verifiedAt: new Date() },
      { student: student1Id, course: courses[1]._id, enrollment: enrollments[1]._id, amount: 199, paymentMethod: 'paypal', paymentProof: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', status: 'verified', verifiedBy: adminId, verifiedAt: new Date() }
    ]);

    console.log('Payments created.');

    // 8. Create Results
    await ExamSubmission.create([
      { 
        student: student1Id, 
        exam: exams[0]._id, 
        enrollment: enrollments[0]._id,
        answers: [{ questionId: exams[0].questions[0]._id, studentAnswer: 'Memoizing values' }], 
        totalMarksObtained: 48, 
        percentage: 96, 
        isPassed: true,
        startedAt: new Date(now.getTime() - 3600000),
        submittedAt: new Date(now.getTime() - 1800000),
        status: 'graded'
      },
      { 
        student: student1Id, 
        exam: exams[1]._id, 
        enrollment: enrollments[1]._id,
        answers: [{ questionId: exams[1].questions[0]._id, studentAnswer: 'User Experience' }], 
        totalMarksObtained: 85, 
        percentage: 85, 
        isPassed: true,
        startedAt: new Date(now.getTime() - 7200000),
        submittedAt: new Date(now.getTime() - 3600000),
        status: 'graded'
      }
    ]);

    console.log('Results created.');
    console.log('DATABASE SEEDED SUCCESSFULLY! 🚀');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
