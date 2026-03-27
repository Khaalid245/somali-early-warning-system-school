# Functional Requirements - School Early Warning Support System

## Document Information
- **Project**: School Early Warning Support System
- **Version**: 1.0.0
- **Last Updated**: 2024
- **Author**: System Analysis Team

---

## 1. USER MANAGEMENT & AUTHENTICATION

### FR-1.1: User Registration and Account Management
**Priority**: Critical  
**Description**: System shall support three distinct user roles with unique capabilities.

**Requirements**:
- FR-1.1.1: System shall support three user roles: Administrator, Form Master, and Teacher
- FR-1.1.2: Each user account shall have: name, email (unique), role, phone, profile image, biography
- FR-1.1.3: Administrator shall create and manage all user accounts
- FR-1.1.4: Users shall authenticate using email and password
- FR-1.1.5: System shall enforce password requirements: minimum 8 characters, uppercase, lowercase, digit, special character

### FR-1.2: Authentication System
**Priority**: Critical  
**Description**: Secure authentication using JWT tokens with 2FA support.

**Requirements**:
- FR-1.2.1: System shall authenticate users via email-based login
- FR-1.2.2: System shall issue JWT access tokens (1-hour lifetime) and refresh tokens (7-day lifetime)
- FR-1.2.3: System shall store JWT tokens in httpOnly cookies to prevent XSS attacks
- FR-1.2.4: System shall support Two-Factor Authentication (2FA) using TOTP
- FR-1.2.5: System shall generate QR codes for 2FA setup
- FR-1.2.6: System shall verify 2FA codes with 1-window tolerance
- FR-1.2.7: System shall rotate refresh tokens on each use
- FR-1.2.8: System shall blacklist tokens after rotation

### FR-1.3: Session Management
**Priority**: High  
**Description**: Secure session handling with automatic timeout.

**Requirements**:
- FR-1.3.1: System shall expire sessions after 1 hour of inactivity
- FR-1.3.2: System shall provide 5-minute warning before session expiration
- FR-1.3.3: System shall terminate sessions on browser close
- FR-1.3.4: System shall allow users to manually logout

---

## 2. STUDENT MANAGEMENT

### FR-2.1: Student Profile Management
**Priority**: Critical  
**Description**: Comprehensive student information management.

**Requirements**:
- FR-2.1.1: System shall store student information: admission number (unique), full name, gender, parent contact details
- FR-2.1.2: System shall support student statuses: Active, Transferred, Graduated, Suspended
- FR-2.1.3: System shall maintain permanent student records across academic years
- FR-2.1.4: System shall store parent/guardian information: name, email, phone number
- FR-2.1.5: Administrator shall create, update, and deactivate student records

### FR-2.2: Classroom Management
**Priority**: Critical  
**Description**: Year-based classroom organization and management.

**Requirements**:
- FR-2.2.1: System shall create classrooms with: name, academic year, form master assignment
- FR-2.2.2: Each classroom shall be assigned to one Form Master
- FR-2.2.3: System shall enforce unique classroom names per academic year
- FR-2.2.4: Administrator shall activate/deactivate classrooms
- FR-2.2.5: System shall track classroom creation and update timestamps

### FR-2.3: Student Enrollment
**Priority**: Critical  
**Description**: Annual student enrollment in classrooms.

**Requirements**:
- FR-2.3.1: System shall enroll students in classrooms for specific academic years
- FR-2.3.2: System shall enforce one active enrollment per student per academic year
- FR-2.3.3: System shall track enrollment date automatically
- FR-2.3.4: Administrator shall manage student enrollments
- FR-2.3.5: System shall support enrollment status (active/inactive)

---

## 3. ACADEMIC STRUCTURE

### FR-3.1: Subject Management
**Priority**: High  
**Description**: Subject catalog and organization.

**Requirements**:
- FR-3.1.1: System shall maintain subject catalog with: name (unique), code (unique)
- FR-3.1.2: Administrator shall create and manage subjects
- FR-3.1.3: System shall display subjects in alphabetical order

### FR-3.2: Teaching Assignments
**Priority**: Critical  
**Description**: Teacher-subject-classroom assignment management.

**Requirements**:
- FR-3.2.1: Administrator shall assign teachers to teach specific subjects in specific classrooms
- FR-3.2.2: System shall enforce unique assignments (one teacher per subject per classroom)
- FR-3.2.3: System shall support assignment activation/deactivation without deletion
- FR-3.2.4: Teachers shall only access data for their assigned subjects and classrooms
- FR-3.2.5: System shall track assignment creation timestamps

---

## 4. ATTENDANCE TRACKING

### FR-4.1: Attendance Session Management
**Priority**: Critical  
**Description**: Daily attendance recording sessions.

**Requirements**:
- FR-4.1.1: Teachers shall create attendance sessions for: classroom, subject, date
- FR-4.1.2: System shall enforce one session per classroom-subject-date combination
- FR-4.1.3: System shall automatically record session creator (teacher) and timestamps
- FR-4.1.4: System shall index sessions by date and classroom-subject for performance

### FR-4.2: Attendance Recording
**Priority**: Critical  
**Description**: Individual student attendance status recording.

**Requirements**:
- FR-4.2.1: Teachers shall mark student attendance with statuses: Present, Absent, Late, Excused
- FR-4.2.2: System shall enforce one attendance record per student per session
- FR-4.2.3: Teachers shall optionally add remarks to attendance records
- FR-4.2.4: System shall automatically timestamp attendance records
- FR-4.2.5: System shall validate that all enrolled students are marked before completing session

### FR-4.3: Attendance History and Reporting
**Priority**: High  
**Description**: Historical attendance data access and analysis.

**Requirements**:
- FR-4.3.1: System shall display attendance history by student, date range, subject, or classroom
- FR-4.3.2: System shall calculate attendance statistics: total sessions, present count, absent count, late count, attendance rate
- FR-4.3.3: Teachers shall view attendance for their assigned classes only
- FR-4.3.4: Form Masters shall view attendance for their assigned classroom
- FR-4.3.5: Administrators shall view all attendance data system-wide

### FR-4.4: Attendance Data Archival
**Priority**: Medium  
**Description**: Long-term attendance data management.

**Requirements**:
- FR-4.4.1: System shall automatically archive attendance records older than 2 years
- FR-4.4.2: System shall maintain archived data in separate tables for performance
- FR-4.4.3: System shall preserve all archived data for compliance (7-year retention)
- FR-4.4.4: Administrators shall access archived attendance data when needed

---

## 5. RISK ASSESSMENT & ALERTS

### FR-5.1: Automated Risk Calculation
**Priority**: Critical  
**Description**: Real-time student risk assessment based on attendance patterns.

**Requirements**:
- FR-5.1.1: System shall automatically calculate risk scores after each attendance session completion
- FR-5.1.2: System shall calculate subject-level risk insights: total sessions, absence count, late count, absence rate
- FR-5.1.3: System shall calculate consecutive absence streaks per subject
- FR-5.1.4: System shall calculate full-day absence streaks (absent from all subjects)
- FR-5.1.5: System shall compute overall student risk score based on: average absence rate, subject streaks, full-day streaks
- FR-5.1.6: System shall apply risk score adjustments:
  - +15 points for 3+ consecutive subject absences
  - +25 points for 5+ consecutive subject absences
  - +40 points for 7+ consecutive subject absences
  - +25 points for 3+ full-day absences
  - +40 points for 5+ full-day absences

### FR-5.2: Risk Level Classification
**Priority**: Critical  
**Description**: Categorization of student risk levels.

**Requirements**:
- FR-5.2.1: System shall classify risk levels based on risk score:
  - Low: 0-29 points
  - Medium: 30-54 points
  - High: 55-74 points
  - Critical: 75+ points
- FR-5.2.2: System shall update risk levels automatically when risk scores change
- FR-5.2.3: System shall maintain risk profile history with timestamps

### FR-5.3: Alert Generation
**Priority**: Critical  
**Description**: Automatic alert creation for at-risk students.

**Requirements**:
- FR-5.3.1: System shall automatically create alerts when student risk level reaches High or Critical
- FR-5.3.2: System shall support alert types: Attendance Risk, Behavior Risk, Academic Risk
- FR-5.3.3: System shall assign alerts to the student's Form Master automatically
- FR-5.3.4: System shall support alert statuses: Active, Under Review, Escalated, Resolved, Dismissed
- FR-5.3.5: System shall update existing alert risk levels when student risk changes
- FR-5.3.6: System shall automatically resolve alerts when risk level drops to Medium or Low

### FR-5.4: Alert Management
**Priority**: High  
**Description**: Alert workflow and status management.

**Requirements**:
- FR-5.4.1: Form Masters shall view all alerts assigned to them
- FR-5.4.2: Form Masters shall update alert status (Under Review, Escalated, Resolved, Dismissed)
- FR-5.4.3: Form Masters shall escalate alerts to administrators
- FR-5.4.4: Teachers shall view alerts for students in their assigned classes
- FR-5.4.5: System shall display alerts sorted by risk level (Critical → High → Medium → Low)
- FR-5.4.6: System shall show alert age (days since creation)

---

## 6. INTERVENTION MANAGEMENT

### FR-6.1: Intervention Case Creation
**Priority**: Critical  
**Description**: Structured intervention case management.

**Requirements**:
- FR-6.1.1: System shall automatically create intervention cases when High/Critical alerts are generated
- FR-6.1.2: System shall link intervention cases to triggering alerts
- FR-6.1.3: System shall assign cases to student's Form Master automatically
- FR-6.1.4: System shall support case statuses: Open, In Progress, Awaiting Parent, Escalated to Admin, Closed
- FR-6.1.5: Form Masters shall manually create intervention cases for students

### FR-6.2: Intervention Meeting Records
**Priority**: High  
**Description**: Documentation of Form Master meetings with students.

**Requirements**:
- FR-6.2.1: Form Masters shall record intervention meetings with: meeting date, absence reason, root cause, intervention notes, action plan
- FR-6.2.2: System shall support root cause categories: Health Issue, Family Issue, Academic Difficulty, Financial Issue, Behavioral Issue, Other
- FR-6.2.3: Form Masters shall set urgency levels: Low, Medium, High
- FR-6.2.4: Form Masters shall set follow-up dates for meetings
- FR-6.2.5: System shall support meeting statuses: Open, Monitoring, Improving, Not Improving, Escalated, Closed
- FR-6.2.6: System shall prevent duplicate active interventions for same student and root cause

### FR-6.3: Progress Tracking
**Priority**: High  
**Description**: Chronological intervention progress documentation.

**Requirements**:
- FR-6.3.1: Form Masters shall add progress updates to intervention meetings
- FR-6.3.2: System shall timestamp all progress updates automatically
- FR-6.3.3: System shall display progress updates in reverse chronological order
- FR-6.3.4: Form Masters shall track progress status: No Contact Yet, Student Contacted, Showing Improvement, Not Improving, Issue Resolved

### FR-6.4: Case Management Workflow
**Priority**: High  
**Description**: Intervention case lifecycle management.

**Requirements**:
- FR-6.4.1: Form Masters shall update case status throughout intervention lifecycle
- FR-6.4.2: Form Masters shall add meeting dates and meeting notes to cases
- FR-6.4.3: Form Masters shall document outcome notes and resolution notes
- FR-6.4.4: Form Masters shall escalate cases to administrators with escalation reasons
- FR-6.4.5: System shall track case age (days since creation)
- FR-6.4.6: System shall flag overdue cases (open > 14 days)
- FR-6.4.7: System shall implement optimistic locking to prevent concurrent update conflicts

### FR-6.5: Intervention Reporting
**Priority**: Medium  
**Description**: Intervention effectiveness analysis.

**Requirements**:
- FR-6.5.1: System shall calculate average case resolution time
- FR-6.5.2: System shall calculate case success rate (resolved vs total closed)
- FR-6.5.3: System shall calculate attendance improvement rate after interventions
- FR-6.5.4: System shall compute intervention effectiveness score (composite metric)
- FR-6.5.5: Form Masters shall view intervention statistics on dashboard

---

## 7. MESSAGING SYSTEM

### FR-7.1: Internal Messaging
**Priority**: Medium  
**Description**: Communication between teachers and form masters.

**Requirements**:
- FR-7.1.1: Teachers shall send messages to Form Masters with: subject, message body
- FR-7.1.2: Form Masters shall send messages to Teachers
- FR-7.1.3: System shall track message read status (read/unread)
- FR-7.1.4: System shall timestamp message creation and read time
- FR-7.1.5: Users shall view sent and received messages
- FR-7.1.6: System shall display messages in reverse chronological order

---

## 8. DASHBOARD & ANALYTICS

### FR-8.1: Administrator Dashboard
**Priority**: High  
**Description**: System-wide overview and analytics for administrators.

**Requirements**:
- FR-8.1.1: System shall display total active students count
- FR-8.1.2: System shall display active alerts count with month-over-month change percentage
- FR-8.1.3: System shall display open intervention cases count with trend
- FR-8.1.4: System shall show 6-month alert trend chart
- FR-8.1.5: System shall show 6-month case trend chart
- FR-8.1.6: System shall display case status breakdown (Open, In Progress, Awaiting Parent)
- FR-8.1.7: Administrators shall filter dashboard by date range and risk level

### FR-8.2: Form Master Dashboard
**Priority**: Critical  
**Description**: Classroom-focused dashboard for form masters.

**Requirements**:
- FR-8.2.1: System shall display assigned alerts count with trend
- FR-8.2.2: System shall display open cases count with trend
- FR-8.2.3: System shall display high-risk students count in assigned classroom
- FR-8.2.4: System shall display escalated cases count
- FR-8.2.5: System shall list urgent alerts sorted by priority (Critical → High → Medium → Low)
- FR-8.2.6: System shall list pending cases with overdue indicators
- FR-8.2.7: System shall display high-risk students with: risk score, attendance rate, open cases count, priority score
- FR-8.2.8: System shall show classroom statistics: total students, attendance rate, absent count, average risk score, health status
- FR-8.2.9: System shall display overdue follow-ups count
- FR-8.2.10: System shall highlight students needing immediate attention (no intervention or overdue follow-up)
- FR-8.2.11: System shall show KPI metrics: average resolution time, case success rate, attendance improvement rate, intervention effectiveness score
- FR-8.2.12: System shall display workload indicator (score and status: manageable/moderate/high)

### FR-8.3: Teacher Dashboard
**Priority**: Critical  
**Description**: Class-focused dashboard for teachers.

**Requirements**:
- FR-8.3.1: System shall display today's absent count with trend
- FR-8.3.2: System shall display active alerts count for assigned subjects with trend
- FR-8.3.3: System shall show 6-month absence trend chart
- FR-8.3.4: System shall show 6-month alert trend chart
- FR-8.3.5: System shall list high-risk students in assigned classes with visual indicators
- FR-8.3.6: System shall list urgent alerts with urgency scores
- FR-8.3.7: System shall display assigned classes with student counts and recent attendance rates
- FR-8.3.8: System shall show recent attendance sessions (last 7 days)
- FR-8.3.9: System shall display weekly attendance statistics (present %, late %, absent %)
- FR-8.3.10: System shall show week-over-week attendance trend
- FR-8.3.11: System shall display overall average attendance rate
- FR-8.3.12: System shall generate actionable items prioritized by urgency
- FR-8.3.13: System shall provide AI-powered insights and recommendations
- FR-8.3.14: System shall support time range filters: Current Week, Current Month, Current Semester, Academic Year
- FR-8.3.15: System shall display semester comparison (current vs previous)
- FR-8.3.16: System shall show student progress tracking (30-day comparison)
- FR-8.3.17: System shall provide onboarding guidance for teachers with no assignments

### FR-8.4: Dashboard Performance
**Priority**: High  
**Description**: Dashboard data caching and optimization.

**Requirements**:
- FR-8.4.1: System shall cache dashboard data for 5 minutes (300 seconds)
- FR-8.4.2: System shall use Redis for caching when available, fallback to local memory cache
- FR-8.4.3: System shall generate unique cache keys per user and filter combination
- FR-8.4.4: System shall paginate high-risk students and urgent alerts (20 items per page)

---

## 9. SECURITY & ACCESS CONTROL

### FR-9.1: Role-Based Access Control (RBAC)
**Priority**: Critical  
**Description**: Strict permission enforcement based on user roles.

**Requirements**:
- FR-9.1.1: Administrators shall access all system features and data
- FR-9.1.2: Form Masters shall only access data for their assigned classroom
- FR-9.1.3: Teachers shall only access data for their assigned subjects and classrooms
- FR-9.1.4: System shall enforce IDOR protection (Insecure Direct Object Reference)
- FR-9.1.5: System shall validate resource ownership before allowing access
- FR-9.1.6: System shall return 403 Forbidden for unauthorized access attempts

### FR-9.2: Rate Limiting
**Priority**: High  
**Description**: Protection against brute force and abuse.

**Requirements**:
- FR-9.2.1: System shall limit login attempts to 10 per hour per IP
- FR-9.2.2: System shall lock accounts for 15 minutes after 10 failed login attempts
- FR-9.2.3: System shall limit API requests to 1000 per hour for authenticated users
- FR-9.2.4: System shall limit anonymous requests to 100 per hour
- FR-9.2.5: System shall limit dashboard requests to 100 per hour
- FR-9.2.6: System shall limit file uploads to 10 per hour
- FR-9.2.7: System shall limit bulk operations to 5 per hour

### FR-9.3: Input Validation & Sanitization
**Priority**: Critical  
**Description**: Protection against injection attacks.

**Requirements**:
- FR-9.3.1: System shall sanitize all user input to prevent XSS attacks
- FR-9.3.2: System shall validate SQL queries to prevent SQL injection
- FR-9.3.3: System shall validate file uploads (type, size, content)
- FR-9.3.4: System shall enforce maximum file upload size of 5MB
- FR-9.3.5: System shall validate date formats (YYYY-MM-DD)
- FR-9.3.6: System shall validate email formats

### FR-9.4: Audit Logging
**Priority**: High  
**Description**: Comprehensive activity logging for compliance.

**Requirements**:
- FR-9.4.1: System shall log all user authentication attempts (success and failure)
- FR-9.4.2: System shall log all data modifications (create, update, delete)
- FR-9.4.3: System shall log all permission denied events
- FR-9.4.4: System shall retain audit logs for 7 years (FERPA compliance)
- FR-9.4.5: System shall include in logs: timestamp, user ID, action, IP address, user agent
- FR-9.4.6: Administrators shall access and search audit logs

---

## 10. NOTIFICATIONS

### FR-10.1: Email Notifications
**Priority**: Medium  
**Description**: Automated email alerts for critical events.

**Requirements**:
- FR-10.1.1: System shall send email alerts to parents after 3+ consecutive absences
- FR-10.1.2: System shall send email notifications for escalated cases
- FR-10.1.3: System shall support email configuration via environment variables
- FR-10.1.4: System shall use console backend for development, SMTP for production
- FR-10.1.5: System shall include student name, absence count, and contact information in emails

---

## 11. DATA EXPORT & REPORTING

### FR-11.1: Data Export (Planned)
**Priority**: Low  
**Description**: Export functionality for external analysis.

**Requirements**:
- FR-11.1.1: System shall support CSV export of attendance data
- FR-11.1.2: System shall support PDF export of intervention reports
- FR-11.1.3: System shall support Excel export of student lists
- FR-11.1.4: Administrators shall export system-wide data
- FR-11.1.5: Form Masters shall export classroom-specific data
- FR-11.1.6: Teachers shall export data for assigned classes

**Status**: Planned for future release

---

## 12. API DOCUMENTATION

### FR-12.1: Interactive API Documentation
**Priority**: Medium  
**Description**: Comprehensive API documentation for developers.

**Requirements**:
- FR-12.1.1: System shall provide Swagger UI at /api/schema/swagger-ui/
- FR-12.1.2: System shall provide ReDoc at /api/schema/redoc/
- FR-12.1.3: System shall provide OpenAPI schema at /api/schema/
- FR-12.1.4: Documentation shall include all endpoints with request/response examples
- FR-12.1.5: Documentation shall organize endpoints by tags: Authentication, Users, Students, Attendance, Alerts, Interventions, Dashboard, Risk

---

## TRACEABILITY MATRIX

| Requirement ID | Feature | Implementation Status | Test Coverage |
|---------------|---------|----------------------|---------------|
| FR-1.x | User Management | ✅ Complete | 82% |
| FR-2.x | Student Management | ✅ Complete | 84% |
| FR-3.x | Academic Structure | ✅ Complete | 78% |
| FR-4.x | Attendance Tracking | ✅ Complete | 80% |
| FR-5.x | Risk Assessment | ✅ Complete | 94% |
| FR-6.x | Intervention Management | ✅ Complete | 84% |
| FR-7.x | Messaging System | ✅ Complete | 65% |
| FR-8.x | Dashboard & Analytics | ✅ Complete | 83% |
| FR-9.x | Security & Access Control | ✅ Complete | 75% |
| FR-10.x | Notifications | ⚠️ Partial | 60% |
| FR-11.x | Data Export | 🔄 Planned | N/A |
| FR-12.x | API Documentation | ✅ Complete | N/A |

---

**Document End**
