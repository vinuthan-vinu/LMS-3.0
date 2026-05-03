# LMS with Voice Chatbot - Project Documentation

## 1. System Architecture
The system follows a Client-Server architecture.
- **Frontend**: React Native mobile app interacting with the backend via REST API.
- **Backend**: Node.js + Express server implementing a layered architecture (Routes -> Controllers -> Models).
- **Database**: MongoDB Atlas for persistent data storage.
- **External Services**: Cloudinary for file uploads, Railway for backend hosting.

## 2. Database Schema
- **User**: { name, email, password, role (Student/Teacher/Admin), profilePicture }
- **Course**: { title, description, teacher (ref User), price, thumbnail }
- **Enrollment**: { student (ref User), course (ref Course), status (Pending/Approved/Rejected) }
- **Payment**: { user (ref User), course (ref Course), amount, proofUrl, status (Pending/Verified/Failed) }
- **Resource**: { course (ref Course), title, fileUrl, fileType, uploadedBy (ref User) }
- **Exam**: { course (ref Course), title, questions: [{ question, options, correctAnswer }], duration }
- **Result**: { exam (ref Exam), student (ref User), score }
- **Chat**: { user (ref User), messages: [{ sender, text, timestamp }] }

## 3. API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (Protected)

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Protected, Teacher/Admin)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course (Protected, Teacher/Admin)
- `DELETE /api/courses/:id` - Delete course (Protected, Teacher/Admin)

### Enrollments
- `POST /api/enrollments/enroll` - Enroll in course (Protected)
- `GET /api/enrollments/my-enrollments` - Get my enrollments (Protected)
- `PUT /api/enrollments/:id/status` - Update enrollment status (Protected, Teacher/Admin)

### Payments
- `POST /api/payments/upload` - Upload payment proof (Protected)
- `PUT /api/payments/:id/verify` - Verify payment (Protected, Admin)
- `GET /api/payments/history` - Get payment history (Protected)

### Resources
- `POST /api/resources/upload` - Upload resource (Protected, Teacher/Admin)
- `GET /api/resources/course/:courseId` - Get course resources (Protected)
- `DELETE /api/resources/:id` - Delete resource (Protected, Teacher/Admin)

### Exams
- `POST /api/exams` - Create exam (Protected, Teacher/Admin)
- `GET /api/exams/course/:courseId` - Get course exams (Protected)
- `POST /api/exams/submit` - Submit exam (Protected)
- `GET /api/exams/my-results` - Get my results (Protected)

### Chatbot
- `POST /api/chat/message` - Send message to bot (Protected)
- `GET /api/chat/history` - Get chat history (Protected)

## 4. Deployment Instructions (Railway)
1. Push the `backend` folder to a GitHub repository.
2. Connect GitHub to Railway.app.
3. Add the following Environment Variables in Railway:
   - `MONGODB_URI`: Your Atlas connection string.
   - `JWT_SECRET`: A secure random string.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: From your Cloudinary dashboard.
4. Deploy and copy the provided public URL.
5. Update `frontend/src/api/client.js` with this URL.
