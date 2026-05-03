const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Exam = require('../models/Exam');

async function forceUpgradeExams() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const standardQuestions = [
      { questionText: "What is the main purpose of this topic?", options: ["Core Logic", "Style", "Structure", "None"], correctAnswer: "Core Logic", marks: 20, questionType: "multiple_choice" },
      { questionText: "Which keyword is used to declare a constant?", options: ["let", "var", "const", "static"], correctAnswer: "const", marks: 20, questionType: "multiple_choice" },
      { questionText: "What does this concept prioritize?", options: ["Performance", "Aesthetics", "Security", "All of the above"], correctAnswer: "All of the above", marks: 20, questionType: "multiple_choice" },
      { questionText: "How do you define a list of items?", options: ["Array", "String", "Number", "Boolean"], correctAnswer: "Array", marks: 20, questionType: "multiple_choice" },
      { questionText: "What is the best practice for error handling?", options: ["try/catch", "ignore", "console.log", "delete"], correctAnswer: "try/catch", marks: 20, questionType: "multiple_choice" }
    ];

    console.log('Upgrading all exams to standard 5-question format...');
    const result = await Exam.updateMany(
      {}, // Apply to all exams
      { 
        $set: { 
          questions: standardQuestions,
          totalMarks: 100,
          passingMarks: 50,
          duration: 30,
          examType: "quiz"
        } 
      }
    );

    console.log(`✅ Success! Upgraded ${result.modifiedCount} exams.`);
  } catch (error) {
    console.error('Failed to upgrade exams:', error);
  } finally {
    await mongoose.connection.close();
  }
}

forceUpgradeExams();
