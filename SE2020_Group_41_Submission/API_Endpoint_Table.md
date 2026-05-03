# API Endpoint Table

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Users** | POST | `/api/users/register` | Register new user |
| | POST | `/api/users/login` | User login |
| | GET | `/api/users/profile` | Get user profile (Protected) |
| **Courses** | GET | `/api/courses` | Get all courses |
| | POST | `/api/courses` | Create course (Protected, Teacher/Admin) |
| | GET | `/api/courses/:id` | Get course details |
| | PUT | `/api/courses/:id` | Update course (Protected, Teacher/Admin) |
| | DELETE | `/api/courses/:id` | Delete course (Protected, Teacher/Admin) |
| **Enrollments**| POST | `/api/enrollments/enroll` | Enroll in course (Protected) |
| | GET | `/api/enrollments/my-enrollments` | Get student enrollments (Protected) |
| | PUT | `/api/enrollments/:id/status`| Update enrollment status (Teacher/Admin) |
| **Payments** | POST | `/api/payments/upload` | Upload payment proof (Protected) |
| | PUT | `/api/payments/:id/verify`| Verify payment (Admin) |
| | GET | `/api/payments/history`| Get payment history (Protected) |
| **Resources** | POST | `/api/resources/upload` | Upload resource (Teacher/Admin) |
| | GET | `/api/resources/course/:id`| Get course resources (Protected) |
| | DELETE | `/api/resources/:id` | Delete resource (Teacher/Admin) |
| **Exams** | POST | `/api/exams` | Create exam (Teacher/Admin) |
| | GET | `/api/exams/course/:id`| Get course exams (Protected) |
| | POST | `/api/exams/submit` | Submit exam (Protected) |
| | GET | `/api/exams/my-results`| Get my results (Protected) |
| **Chatbot** | POST | `/api/chat/message` | Send message to bot (Protected) |
| | GET | `/api/chat/history` | Get chat history (Protected) |
