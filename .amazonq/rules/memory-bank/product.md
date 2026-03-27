# Product Overview

## Project Purpose
School Early Warning Support System (AlifMonitor) — a full-stack web application that helps schools monitor student attendance, identify early academic risk indicators, and manage structured intervention workflows between teachers, form masters, and administrators.

Live at: https://www.alifmonitor.com

## Value Proposition
- Reduces attendance recording time from ~10 min to ~3 min per class
- Automatically generates risk alerts, eliminating manual monitoring
- Provides form masters a real-time centralized view of classroom health
- Gives administrators school-wide analytics and audit compliance tools

## Key Features

### Attendance Tracking
- Teachers record daily attendance (present/absent/late) per class session
- Attendance sessions are archived; export service available
- Daily monitor view and student-level attendance reports

### Risk Alert System
- Automatic risk profile generation per student (risk/services.py)
- Alerts flagged based on attendance thresholds and patterns
- Risk levels surfaced on form master and admin dashboards

### Intervention Workflow
- Form masters open, manage, and escalate intervention cases
- Progress updates and meeting logs tracked per case
- Bulk analysis service for classroom-wide risk assessment
- AI recommendations module for intervention suggestions

### Messaging
- Direct teacher ↔ form master messaging system
- Messages scoped by role and classroom assignment

### Dashboards (Role-Based)
- Teacher: attendance, alerts, messages, class/subject assignments
- Form Master: classroom risk overview, intervention cases, student progress
- Admin: user management, classroom setup, system-wide analytics, audit logs

### Security & Auth
- JWT authentication via httpOnly cookies
- Optional/mandatory 2FA (TOTP with QR codes)
- RBAC with three roles: Admin, Teacher, Form Master
- Rate limiting (10 login attempts, 15-min lockout)
- CSRF, XSS sanitization, SQL injection middleware, IDOR protection
- Audit logging with 7-year retention (FERPA)

### API & Docs
- Django REST Framework with Swagger/OpenAPI (drf-spectacular)
- Swagger UI: /api/schema/swagger-ui/
- ReDoc: /api/schema/redoc/

## Target Users
| Role | Primary Tasks |
|------|--------------|
| Teacher | Record attendance, create alerts, message form masters |
| Form Master | Monitor classroom risk, manage interventions, track student progress |
| Administrator | Manage users/classrooms/enrollments, view analytics, audit compliance |

## Use Cases
- Daily attendance recording for assigned classes
- Automatic at-risk student identification
- Structured intervention case management
- Teacher-to-form-master escalation workflow
- School-wide reporting and governance
