01). GitHub Repository Link
GitHub Repository: https://github.com/vinuthan-vinu/LMS-3.0

02). Team Details
Group Number: 41
Member 1: IT24103306 – Thuvarkan.V – Enrollment and Payment Verification
Member 2: IT24100407 – Perera B.K.W – Voice Chatbot Interaction & User Management
Member 3: IT24102903 – Manodith H.A.V – Secure Assessment
Member 4: IT24102767 – Prakash J – Lesson and Resource Management
Member 5: IT24103397 – Shashini N.S.G – Schedule Management
Member 6: IT24100836 – Abeywardana Y.C.Y – Notification and Announcement System

03). Deployment Details
Backend URL: https://lms-30-production.up.railway.app
Deployment Platform: Railway (Cloud Hosting)
Environment: Production
Database Instance: MongoDB Atlas (Cloud)
Storage Service: Cloudinary (Media CDN)

04). Project Overview
Project Title: Voice-Enabled Learning Management System (LMS)
Description: A centralized platform designed for online tuition centers and private educators to manage academic operations. The system features a unique voice-enabled chatbot interface to enhance accessibility and automate student inquiries.

05). Key Features & Functionalities
- Voice-Enabled AI Chatbot: Natural language processing for student support and automated onboarding.
- Multi-Role Dashboard: Specialized views for Admin, Teacher, and Student roles.
- Course Management: Comprehensive system for creating, updating, and organizing course content.
- Multimedia Resource Center: Secure storage and distribution of PDFs, Videos, and Notes.
- Automated Enrollment: Streamlined course sign-up process with verification workflow.
- Payment Verification System: Digital receipt submission and administrative auditing.
- Timer-Based Assessments: Interactive quiz module with real-time scoring and result tracking.
- Announcement System: Centralized notification hub for broadcasting academic updates.

06). Technology Stack (MERN Variant)
- Frontend: React Native (Expo SDK 51) - High-performance mobile experience.
- Backend: Node.js (v18+) & Express.js - Robust server-side logic and API routing.
- Database: MongoDB - Schema-less document storage for flexible data modeling.
- Middleware: Mongoose (ODM), JWT (Security), Multer (File Handling).
- Third-Party APIs: Cloudinary API, Web Speech API (for voice features).

07). Installation & Local Setup
Step 1: Clone the repository
   $ git clone https://github.com/vinuthan-vinu/LMS-3.0.git

Step 2: Backend Setup
   $ cd backend
   $ npm install
   $ Create .env file with MONGODB_URI, JWT_SECRET, and Cloudinary keys
   $ npm start

Step 3: Frontend Setup
   $ cd mobile
   $ npm install
   $ Update API_URL in src/api/client.js
   $ npx expo start

08). System Requirements
- Software: Node.js v18+, Git, Expo Go (for mobile testing).
- Hardware: Minimum 8GB RAM, stable internet connection for cloud services.

09). Project Impact & Sustainability
- Digital Transformation: Eliminates paper-based records for tuition centers.
- Student Engagement: Voice interactivity increases user retention and ease of use.
- Data Integrity: Secure hashing and encrypted storage for sensitive user data.

10). Future Roadmap
- Phase 1: Real-time video conferencing integration (WebRTC/Zoom).
- Phase 2: AI-driven personalized learning recommendations based on quiz scores.
- Phase 3: Parent portal for monitoring student progress and payment history.
- Phase 4: Offline mode for course material access in low-bandwidth areas.

11). License
This project is licensed under the MIT License - see the LICENSE file for details.
