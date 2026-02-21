# School Early Warning Support System

##watch the demo here:
https://youtu.be/PFkA5nrmrZM

## Description

The School Early Warning Support System is a full-stack web application designed to assist schools in monitoring student attendance, identifying early academic risk indicators, and supporting structured intervention workflows between teachers, counselors, and administrators.

The system enables data-driven educational decision-making by combining a secure backend API, a modern frontend interface, and a relational database designed to support future analytics, alerts, and intervention management.

---

## Technology Stack

- Frontend: React (Vite) with Tailwind CSS
- Backend: Django REST Framework
- Database: MySQL
- Authentication: JWT-based authentication
- Architecture: Three-tier full-stack architecture

---

## GitHub Repository

https://github.com/Khaalid245/somali-early-warning-system-school

---

## Project Structure

```
somali-early-warning-system-school/
│
├── somali-early-warning-system/
│   ├── .venv/
│   ├── school_support_backend/
│   ├── school_support_frontend/
│   ├── screenshots/
│   └── README.md
│
└── README.md
```

---

## Prerequisites

### Required Software Versions

- Python 3.11+
- Node.js 18+
- npm 9+
- MySQL Server 8.0+
- Git 2.x

---

## Environment Setup (Windows)

### 1. Clone the Repository

```bash
git clone https://github.com/Khaalid245/somali-early-warning-system-school.git
cd somali-early-warning-system-school/somali-early-warning-system
```

---

### 2. Create Virtual Environment

```powershell
python -m venv .venv
```

### 3. Activate Virtual Environment

```powershell
.venv\Scripts\activate
```

---

## Backend Setup (Django REST Framework)

### 4. Install Backend Dependencies

```bash
cd school_support_backend
pip install -r requirements.txt
```

---

### 5. Environment Variables Configuration

Create a `.env` file inside `school_support_backend`:

```env
DB_NAME=school_support_db
DB_USER=django_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
SECRET_KEY=your_secret_key
DEBUG=True
```

Ensure Django loads environment variables using `python-dotenv` or `os.environ`.

---

### 6. Database Creation

Create the database in MySQL:

```sql
CREATE DATABASE school_support_db;
```

---

### 7. Run Migrations

```bash
python manage.py migrate
```

---

### 8. Start Backend Server

```bash
python manage.py runserver
```

Backend URL:

```
http://127.0.0.1:8000/
```

---

## Frontend Setup (React)

```bash
cd ../school_support_frontend
npm install
npm run dev
```

Frontend URL:

```
http://localhost:5173/
```

---

## Usage Guide

### For Teachers
1. Access the frontend at `http://localhost:5173/`
2. Log in with teacher credentials
3. Record daily attendance
4. Create alerts for at-risk students
5. View assigned classes and students

### For Form Masters
1. Log in with form master credentials
2. View classroom dashboard with risk indicators
3. Manage intervention cases
4. Track student progression
5. Monitor attendance patterns

### For Administrators
1. Log in with admin credentials
2. Access System Control Center
3. Navigate to **Governance** tab for:
   - **User Management**: Create and manage users (Admin, Form Master, Teacher)
   - **Classroom Management**: Create classrooms and assign form masters
   - **Student Enrollment**: Enroll students in classrooms
   - **Teacher Assignment**: Assign teachers to classes and subjects
4. View system-wide analytics and reports
5. Monitor audit logs for compliance

---

## API Overview

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| POST   | /api/auth/login    | User login                  |
| POST   | /api/auth/register | User registration           |
| GET    | /api/students      | Retrieve students           |
| POST   | /api/students      | Create student              |
| GET    | /api/attendance    | Retrieve attendance records |
| POST   | /api/attendance    | Record attendance           |

---

## System Architecture

The system follows a three-tier architecture:

- Presentation Layer: React frontend
- Application Layer: Django REST API
- Data Layer: MySQL relational database

![System Architecture](screenshots/system_architecture.png)

---

## Enterprise Governance Features

### Centralized User Provisioning

The system implements **enterprise-grade governance** with centralized user management:

- **No Public Registration**: Only administrators can create user accounts (FERPA compliance)
- **Role-Based Access Control (RBAC)**: Three-tier role hierarchy
  - **Admin**: Full system access, user management, system oversight
  - **Form Master**: Classroom management, intervention cases (one classroom only)
  - **Teacher**: Attendance recording, alert creation (multiple classes)
- **Soft Deletion**: Users are disabled, not deleted (preserves historical data)
- **Audit Logging**: Every governance action is logged for compliance

### Governance Dashboard Features

Access via: **Admin Dashboard → Governance Tab (⚙️)**

1. **User Management**
   - Create users with roles (Admin, Form Master, Teacher)
   - Edit user details (name, email, role)
   - Disable/Enable users (soft delete)
   - Filter users by role
   - View assigned classrooms

2. **Classroom Management**
   - Create classrooms with academic year
   - Assign form masters (1:1 mapping)
   - View student counts per classroom
   - Edit classroom details
   - Prevent duplicate form master assignments

3. **Student Enrollment**
   - Enroll students in classrooms
   - Track academic year progression
   - Prevent duplicate enrollments
   - View all active enrollments

4. **Teacher Assignment**
   - Assign teachers to classes and subjects
   - Support many-to-many relationships
   - Prevent duplicate assignments
   - View all teaching assignments

### Security & Compliance

- **IDOR Protection**: Form Masters can only access their assigned classroom
- **JWT Authentication**: Stateless, scalable authentication
- **Audit Logging**: 7-year retention (FERPA requirement)
- **Data Isolation**: Role-based data access boundaries
- **FERPA/GDPR Compliance**: Privacy-aware design

### Documentation

Comprehensive governance documentation available:
- **[GOVERNANCE_QUICK_START.md](GOVERNANCE_QUICK_START.md)** - 5-minute test guide
- **[GOVERNANCE_ARCHITECTURE.md](GOVERNANCE_ARCHITECTURE.md)** - Architecture deep dive
- **[GOVERNANCE_PRESENTATION_GUIDE.md](GOVERNANCE_PRESENTATION_GUIDE.md)** - Presentation materials
- **[GOVERNANCE_DOCUMENTATION_INDEX.md](GOVERNANCE_DOCUMENTATION_INDEX.md)** - Complete index

---

## Designs

### Figma Mockups

https://www.figma.com/design/Wm6KJwRO8ORANAFwRMx7t8/Untitled?node-id=0-1&t=kA82b1tj4S0sL9Dw-1

## Screenshots

Screenshots are located in the `screenshots/` directory:

## Screenshots

Screenshots are located in the `screenshots/` directory:

## Screenshots

### Login Interface

![Login Interface](screenshots/login.png)

### Teacher Dashboard

![Teacher Dashboard](screenshots/teacher_dashboard.png)

### Attendance Interface

![Attendance Interface](screenshots/attendance_dashboard.png)

### Database Schema

![Database Schema](screenshots/database_schema.png)

### System Architecture

![System Architecture](screenshots/system_architecture.png)

- Database schema (MySQL Workbench)

---

## Deployment Plan

### Current Deployment

- Local deployment using MySQL, Django REST Framework, and React
- All services run on localhost for development and testing

### Production Deployment Strategy

1. Frontend built using `npm run build`
2. Static files served via Nginx
3. Backend deployed using Gunicorn
4. Application containerized with Docker
5. MySQL hosted as managed cloud service
6. CI/CD pipeline for automated deployment

---

## Project Status

### Completed

- ✅ Backend API architecture
- ✅ Database schema and migrations
- ✅ JWT authentication with RBAC
- ✅ Attendance recording and monitoring
- ✅ Frontend-backend integration
- ✅ **Admin Dashboard with System Control Center**
- ✅ **Enterprise Governance Layer**
  - User Management (create, edit, disable/enable users)
  - Classroom Management (create, assign form masters)
  - Student Enrollment (enroll students in classrooms)
  - Teacher Assignment (assign teachers to classes/subjects)
- ✅ **Form Master Dashboard**
  - Classroom risk management
  - Intervention case management
  - Student progression tracking
- ✅ **Teacher Dashboard**
  - Attendance recording
  - Alert creation
  - Student monitoring
- ✅ **Security & Compliance**
  - Role-based access control (RBAC)
  - IDOR protection
  - Audit logging
  - FERPA/GDPR compliance awareness

### Planned

- Advanced analytics and reporting
- Email notifications
- Bulk operations (CSV import)
- Two-factor authentication (2FA)
- Cloud deployment

---

---

## License

Developed for academic purposes.
