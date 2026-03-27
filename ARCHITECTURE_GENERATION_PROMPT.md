# PROMPT FOR AI: Generate System Architecture Documentation

## INSTRUCTIONS FOR AI
Create a comprehensive System Architecture section (Section 3.6) for a research proposal. Write in academic research style, NOT technical documentation style. Use narrative paragraphs, not bullet points. Base EVERYTHING on the actual implementation details provided below. DO NOT add features that don't exist. DO NOT exaggerate. Be accurate and factual.

---

## PROJECT OVERVIEW
**Name**: School Early Warning Support System  
**Purpose**: Web-based system for monitoring student attendance, identifying at-risk students, and managing intervention workflows  
**Deployment**: Production at https://www.alifmonitor.com  
**Architecture Pattern**: Three-tier full-stack architecture

---

## TECHNOLOGY STACK (ACTUAL IMPLEMENTATION)

### Backend Stack
- **Framework**: Django 5.1.4 with Django REST Framework
- **Language**: Python 3.11+
- **Database**: MySQL 8.0 (primary), PostgreSQL 13+ (supported), SQLite (testing only)
- **Authentication**: JWT (djangorestframework-simplejwt) with httpOnly cookies
- **Security**: 
  - 2FA: pyotp (TOTP-based)
  - Rate Limiting: django-ratelimit
  - Encryption: cryptography library
  - Password Hashing: bcrypt (Django default with 12 rounds)
- **Caching**: Redis 7 with django-redis (optional, fallback to local memory cache)
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)
- **File Handling**: Pillow (image processing)
- **Monitoring**: Sentry SDK (optional)
- **Production Server**: Gunicorn WSGI server (3 workers, 120s timeout)
- **Dependencies**: See requirements.txt (mysqlclient, django-cors-headers, django-filter, qrcode, openpyxl, reportlab, python-docx, whitenoise)

### Frontend Stack
- **Framework**: React 19.2.0
- **Build Tool**: Vite (rolldown-vite 7.2.5)
- **Styling**: Tailwind CSS 4.1.18
- **HTTP Client**: Axios 1.13.4
- **Routing**: React Router DOM 7.13.0
- **Form Management**: React Hook Form 7.51.0 with Zod 3.22.4 validation
- **UI Components**: Lucide React 0.575.0 (icons)
- **Charts**: Recharts 3.7.0
- **Notifications**: React Hot Toast 2.4.1
- **Security**: DOMPurify 3.3.1 (XSS prevention)
- **Utilities**: date-fns 4.1.0, jwt-decode 4.0.0, uuid 13.0.0, react-window 2.2.7

### Infrastructure & Deployment
- **Containerization**: Docker with Docker Compose
- **Web Server**: Nginx (reverse proxy, static files, SSL termination)
- **Database Server**: MySQL 8.0 container
- **Cache Server**: Redis 7 Alpine container
- **SSL/TLS**: Let's Encrypt certificates (Certbot)
- **Operating System**: Ubuntu 20.04 LTS (production), Windows 11 (development)

---

## DATABASE ARCHITECTURE (ACTUAL SCHEMA)

### Core Tables (11 Django Apps)

**1. users App**
- User (custom user model extending AbstractBaseUser)
  - Fields: id (PK), name, email (unique), role (admin/teacher/form_master), phone, profile_image, biography, is_staff, is_active, date_joined, updated_at, two_factor_enabled, two_factor_secret
  - Authentication: Email-based (EmailBackend)
  - Manager: Custom UserManager

**2. students App**
- Student
  - Fields: student_id (PK), admission_number (unique), full_name, gender, parent_email, parent_phone, parent_name, status (active/transferred/graduated/suspended), is_active, created_at, updated_at
- Classroom
  - Fields: class_id (PK), name, academic_year, form_master (FK to User), is_active, created_at, updated_at
  - Unique: (name, academic_year)
- StudentEnrollment
  - Fields: enrollment_id (PK), student (FK), classroom (FK), academic_year, enrollment_date, is_active
  - Unique: (student, academic_year)

**3. academics App**
- Subject
  - Fields: subject_id (PK), name (unique), code (unique), created_at
- TeachingAssignment
  - Fields: assignment_id (PK), teacher (FK to User), subject (FK), classroom (FK), is_active, created_at
  - Unique: (teacher, subject, classroom)

**4. attendance App**
- AttendanceSession
  - Fields: session_id (PK), classroom (FK), subject (FK), teacher (FK to User), attendance_date, created_at, updated_at
  - Unique: (classroom, subject, attendance_date)
  - Indexes: attendance_date, (classroom, subject)
- AttendanceRecord
  - Fields: record_id (PK), session (FK), student (FK), status (present/absent/late/excused), remarks, created_at
  - Unique: (session, student)
  - Indexes: student, status
- AttendanceSessionArchive (2+ year old data)
- AttendanceRecordArchive (2+ year old data)

**5. risk App**
- StudentRiskProfile
  - Fields: student (OneToOne FK), risk_score (Decimal), risk_level (low/medium/high/critical), last_calculated, created_at
  - Indexes: risk_level, risk_score
- SubjectRiskInsight
  - Fields: student (FK), subject (FK), total_sessions, absence_count, late_count, absence_rate (Decimal), last_calculated, created_at
  - Unique: (student, subject)
  - Indexes: student, subject

**6. alerts App**
- Alert
  - Fields: alert_id (PK), alert_type (attendance/behavior/academic), risk_level (low/medium/high/critical), status (active/under_review/escalated/resolved/dismissed), student (FK), subject (FK, nullable), assigned_to (FK to User, form_master), escalated_to_admin (Boolean), alert_date, updated_at
  - Indexes: risk_level, status, student, assigned_to

**7. interventions App**
- InterventionCase
  - Fields: case_id (PK), student (FK), alert (FK, nullable), assigned_to (FK to User, form_master), status (open/in_progress/awaiting_parent/escalated_to_admin/closed), follow_up_date, outcome_notes, resolution_notes, escalation_reason, meeting_date, meeting_notes, progress_status (no_contact/contacted/improving/not_improving/resolved), version (optimistic locking), created_at, updated_at
  - Indexes: status, assigned_to
- InterventionMeeting
  - Fields: student (FK), meeting_date, absence_reason, root_cause (health/family/academic/financial/behavioral/other), intervention_notes, action_plan, follow_up_date, urgency_level (low/medium/high), status (open/monitoring/improving/not_improving/escalated/closed), created_by (FK to User), created_at, updated_at
  - Indexes: (student, status), status, urgency_level
  - Validation: Prevents duplicate active interventions for same student+root_cause
- ProgressUpdate
  - Fields: meeting (FK), update_text, created_by (FK to User), created_at

**8. messaging App**
- Message
  - Fields: sender (FK to User), recipient (FK to User), subject, message, is_read, created_at, read_at

**9. core App**
- Provides: Middleware, security utilities, permissions, health checks
- No database models

**10. dashboard App**
- No database models (service layer only)

**11. notifications App**
- No database models (email service only)

### Database Relationships
- One-to-Many: User → Classroom (form_master), User → TeachingAssignment, Classroom → StudentEnrollment, Student → StudentEnrollment, Subject → TeachingAssignment, Classroom → AttendanceSession, Subject → AttendanceSession, User → AttendanceSession, AttendanceSession → AttendanceRecord, Student → AttendanceRecord, Student → Alert, User → Alert (assigned_to), Student → InterventionCase, Alert → InterventionCase, User → InterventionCase (assigned_to), Student → InterventionMeeting, User → InterventionMeeting (created_by), InterventionMeeting → ProgressUpdate, User → Message (sender/recipient)
- One-to-One: Student → StudentRiskProfile
- Many-to-Many: None (all relationships through explicit junction tables)

### Database Constraints
- Foreign Keys: All enforced with CASCADE or SET_NULL
- Unique Constraints: 8 unique constraints across tables
- Indexes: 15+ indexes for performance optimization
- Check Constraints: Enforced via Django model validation

---

## SYSTEM COMPONENTS (ACTUAL MODULES)

### Backend Modules (Django Apps)

**1. core/** - Cross-cutting concerns
- middleware.py: AuditLogMiddleware (logs all API requests)
- jwt_cookie_auth.py: JWTCookieAuthentication (custom JWT handler)
- permissions.py: require_role decorator, validate_resource_ownership
- rate_limit.py: LoginRateLimitMiddleware (10 attempts/hour, 15min lockout)
- security_headers.py: SecurityHeadersMiddleware (HSTS, CSP, X-Frame-Options, etc.)
- sql_injection_middleware_v2.py: SQLInjectionProtectionMiddleware
- replay_protection.py: ReplayAttackProtectionMiddleware (nonce validation)
- xss_sanitizer.py: Input sanitization utilities
- idor_protection.py: IDOR prevention utilities
- password_validators.py: StrongPasswordValidator
- health.py: health_check endpoint
- exceptions.py: custom_exception_handler

**2. users/** - User management & authentication
- models.py: User model with 2FA support
- managers.py: UserManager (custom user creation)
- backends.py: EmailBackend (email-based authentication)
- serializers.py: User serializers with validation
- views/: Login, logout, 2FA setup/verify, user CRUD
- permissions.py: Role-based permission classes

**3. students/** - Student & classroom management
- models.py: Student, Classroom, StudentEnrollment
- serializers.py: Student, Classroom, Enrollment serializers
- views/: Student CRUD, Classroom CRUD, Enrollment management
- urls.py: /api/students/, /api/students/classrooms/

**4. academics/** - Subject & teaching assignments
- models.py: Subject, TeachingAssignment
- serializers.py: Subject, Assignment serializers
- views.py: Subject CRUD, Assignment management

**5. attendance/** - Attendance tracking
- models.py: AttendanceSession, AttendanceRecord, Archive models
- serializers.py: Session, Record serializers
- views.py: Session creation, Record marking
- signals.py: Post-save signal triggers risk calculation
- archive_service.py: Automatic archival (2+ years)
- export_service.py: CSV/Excel export
- daily_monitor_view.py: Daily attendance monitoring
- student_report_view.py: Student attendance reports
- tracking_views.py: Attendance analytics

**6. risk/** - Risk assessment engine
- models.py: StudentRiskProfile, SubjectRiskInsight
- services.py: Risk calculation algorithms
  - update_risk_after_session(): Main entry point
  - _update_subject_insight(): Subject-level metrics
  - _calculate_subject_streak(): Consecutive absences per subject
  - _calculate_full_day_streak(): Full-day absence streaks
  - _update_overall_student_risk(): Overall risk score calculation
  - _handle_alerts_and_interventions(): Auto-create alerts/cases
- serializers.py: Risk profile serializers
- views.py: Risk profile endpoints

**7. alerts/** - Alert management
- models.py: Alert model
- serializers.py: Alert serializers
- views.py: Alert CRUD, status updates, escalation

**8. interventions/** - Intervention case management
- models.py: InterventionCase, InterventionMeeting, ProgressUpdate
- serializers.py: Case, Meeting, Progress serializers
- views.py: Case CRUD, Meeting documentation
- dashboard_view.py: Intervention dashboard
- meeting_views.py: Meeting-specific endpoints

**9. dashboard/** - Dashboard analytics
- services.py: Dashboard data aggregation
  - get_admin_dashboard_data(): System-wide metrics
  - get_form_master_dashboard_data(): Classroom-focused metrics
  - get_teacher_dashboard_data(): Class-focused metrics
- cache_utils.py: Redis caching (5-minute TTL)
- views.py: DashboardView (role-based routing)
- admin_view.py: Admin-specific views
- user_management.py: User management endpoints
- settings_api.py: Dashboard settings

**10. messaging/** - Internal messaging
- models.py: Message model
- serializers.py: Message serializers
- views.py: Message CRUD, read status

**11. notifications/** - Email notifications
- email_service.py: send_absence_alert() (3+ consecutive absences)

### Frontend Modules (React Components)

**Structure:**
- src/admin/: Admin dashboard components
- src/teacher/: Teacher dashboard components
- src/formMaster/: Form Master dashboard components
- src/auth/: Login, 2FA components
- src/landing/: Landing page
- src/components/: Shared UI components
- src/context/: AuthContext (global state)
- src/api/: Axios API client
- src/hooks/: Custom React hooks
- src/utils/: Utility functions

---

## DATA FLOW & WORKFLOWS (ACTUAL IMPLEMENTATION)

### 1. Authentication Flow
1. User submits email + password → POST /api/auth/login/
2. Backend validates credentials (EmailBackend)
3. If 2FA enabled: Return requires_2fa=true
4. User submits 2FA code → POST /api/auth/2fa/verify/
5. Backend verifies TOTP code (pyotp)
6. Backend generates JWT tokens (access: 1h, refresh: 7d)
7. Tokens stored in httpOnly cookies (SameSite=Lax)
8. Frontend stores user info in AuthContext
9. All subsequent requests include cookies automatically

### 2. Attendance Recording Flow
1. Teacher selects classroom + subject + date
2. POST /api/attendance/sessions/ → Creates AttendanceSession
3. System enforces unique constraint (classroom, subject, date)
4. Teacher marks each student: POST /api/attendance/records/
5. System enforces unique constraint (session, student)
6. After all students marked, post_save signal fires
7. Signal triggers: attendance.signals.trigger_risk_after_attendance_record()
8. Signal calls: risk.services.update_risk_after_session()
9. Risk engine calculates: subject insights, streaks, overall risk score
10. If risk ≥ High: Auto-create Alert + InterventionCase
11. Alert assigned to student's Form Master
12. If 3+ consecutive absences: Send email to parent

### 3. Risk Calculation Algorithm (Actual Implementation)
```
For each student after attendance session:
1. Calculate subject-level metrics:
   - Total sessions for subject
   - Absence count for subject
   - Late count for subject
   - Absence rate = (absences / total) * 100

2. Calculate consecutive absence streaks:
   - Subject streak: Count consecutive absences in this subject
   - Full-day streak: Count days absent from ALL subjects

3. Calculate overall risk score:
   - Base score = Average absence rate across all subjects
   - If subject_streak >= 3: +15 points
   - If subject_streak >= 5: +25 points
   - If subject_streak >= 7: +40 points
   - If full_day_streak >= 3: +25 points
   - If full_day_streak >= 5: +40 points

4. Classify risk level:
   - 0-29: Low
   - 30-54: Medium
   - 55-74: High
   - 75+: Critical

5. Auto-create Alert if High/Critical:
   - Alert type: "attendance"
   - Assigned to: Student's Form Master
   - Status: "active"

6. Auto-create InterventionCase if High/Critical:
   - Linked to Alert
   - Assigned to: Student's Form Master
   - Status: "open"

7. Auto-resolve Alert if drops to Medium/Low:
   - Alert status: "resolved"
   - Close related InterventionCases
```

### 4. Dashboard Data Flow
1. User requests dashboard → GET /api/dashboard/
2. Backend checks cache (Redis, 5-minute TTL)
3. If cache miss:
   - Route to role-specific service (admin/form_master/teacher)
   - Execute optimized database queries (select_related, prefetch_related, aggregations)
   - Calculate metrics, trends, statistics
   - Cache result
4. Return JSON response
5. Frontend renders role-specific dashboard

### 5. Intervention Workflow
1. Form Master views alert on dashboard
2. Form Master creates intervention meeting:
   - POST /api/interventions/meetings/
   - Documents: date, reason, root cause, action plan
3. Form Master adds progress updates:
   - POST /api/interventions/meetings/{id}/progress/
4. Form Master updates case status:
   - PATCH /api/interventions/cases/{id}/
   - Status: open → in_progress → closed
5. If not improving: Escalate to admin
   - PATCH /api/interventions/cases/{id}/
   - Status: escalated_to_admin
6. System tracks: resolution time, success rate, attendance improvement

---

## SECURITY ARCHITECTURE (ACTUAL IMPLEMENTATION)

### Authentication & Authorization
- JWT tokens (HS256 algorithm)
- httpOnly cookies (prevent XSS)
- SameSite=Lax (prevent CSRF)
- Token rotation on refresh
- Token blacklist after rotation
- 2FA with TOTP (pyotp)
- Password hashing: bcrypt (12 rounds)
- Session timeout: 1 hour
- Account lockout: 15 minutes after 10 failed attempts

### Middleware Stack (Order Matters)
1. CorsMiddleware (django-cors-headers)
2. SecurityMiddleware (Django)
3. SecurityHeadersMiddleware (custom)
4. SessionMiddleware (Django)
5. CommonMiddleware (Django)
6. CsrfViewMiddleware (Django)
7. AuthenticationMiddleware (Django)
8. MessageMiddleware (Django)
9. ClickjackingMiddleware (Django)
10. SQLInjectionProtectionMiddleware (custom)
11. AuditLogMiddleware (custom)
12. LoginRateLimitMiddleware (custom)
13. ReplayAttackProtectionMiddleware (custom)

### Security Headers (Production)
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: (configured)
- Referrer-Policy: strict-origin-when-cross-origin

### Input Validation
- XSS: DOMPurify (frontend), xss_sanitizer (backend)
- SQL Injection: Django ORM + SQLInjectionProtectionMiddleware
- File Upload: Type validation, 5MB limit, Pillow verification
- Date Validation: YYYY-MM-DD format enforcement
- Email Validation: RFC 5322 compliance

### Access Control
- RBAC: require_role decorator
- IDOR Protection: validate_resource_ownership
- Form Masters: Restricted to assigned classroom
- Teachers: Restricted to assigned subjects/classrooms
- Admins: Full system access

### Rate Limiting
- Login: 10 attempts/hour per IP
- API: 1000 requests/hour (authenticated), 100/hour (anonymous)
- Dashboard: 100 requests/hour
- File Upload: 10/hour
- Bulk Operations: 5/hour

### Audit Logging
- All authentication attempts
- All data modifications (POST, PUT, PATCH, DELETE)
- All permission denied events
- Retention: 7 years (FERPA compliance)
- Format: Timestamp, User ID, Action, IP, User Agent

---

## DEPLOYMENT ARCHITECTURE (ACTUAL PRODUCTION)

### Production Environment (alifmonitor.com)
- **Server**: DigitalOcean Droplet (or similar VPS)
- **OS**: Ubuntu 20.04 LTS
- **Web Server**: Nginx
  - Reverse proxy to Gunicorn
  - Static file serving
  - SSL termination (Let's Encrypt)
  - Security headers
- **Application Server**: Gunicorn
  - 3 worker processes
  - 120-second timeout
  - WSGI: school_support_backend.wsgi:application
- **Database**: MySQL 8.0
  - Connection pooling (CONN_MAX_AGE=600)
  - Health checks enabled
- **Cache**: Redis 7 (optional)
- **SSL/TLS**: Let's Encrypt (Certbot)
  - TLS 1.2+
  - SSL Labs A+ rating
  - HSTS enabled

### Docker Deployment (Alternative)
- **Services**: db (MySQL), redis (Redis), backend (Django), frontend (Nginx)
- **Networking**: Internal Docker network
- **Volumes**: mysql_data (persistent)
- **Health Checks**: MySQL, Redis
- **Ports**: 3307 (MySQL), 6380 (Redis), 8000 (Backend), 5173 (Frontend)

### Development Environment
- **OS**: Windows 11 (tested), macOS, Linux
- **Backend**: Django development server (manage.py runserver)
- **Frontend**: Vite dev server (npm run dev)
- **Database**: MySQL 8.0 local or Docker
- **Cache**: Local memory cache (fallback)

---

## PERFORMANCE OPTIMIZATIONS (ACTUAL IMPLEMENTATION)

### Database Optimizations
- **Indexes**: 15+ indexes on frequently queried fields
- **Query Optimization**: select_related(), prefetch_related()
- **Connection Pooling**: CONN_MAX_AGE=600, CONN_HEALTH_CHECKS=True
- **Archival Strategy**: 2+ year old data moved to archive tables
- **Pagination**: 50 items per page (REST_FRAMEWORK.PAGE_SIZE)

### Caching Strategy
- **Dashboard Data**: Redis cache, 5-minute TTL
- **Cache Keys**: Unique per user + filters
- **Fallback**: Local memory cache if Redis unavailable
- **Cache Hit Rate Target**: >80%

### Frontend Optimizations
- **Code Splitting**: Vite automatic code splitting
- **Lazy Loading**: React.lazy() for route components
- **Virtual Scrolling**: react-window for large lists
- **Memoization**: React.memo() for expensive components
- **Asset Optimization**: Vite build optimization

### API Optimizations
- **Batch Queries**: Aggregations instead of loops
- **Selective Fields**: Only return needed fields
- **Compression**: Gzip compression (Nginx)
- **CDN**: Static assets served via CDN (production)

---

## MEASURED PERFORMANCE (ACTUAL RESULTS)

### Production (alifmonitor.com)
- Page Load Time: 2.16 seconds
- API Response Time: 2.1 seconds average (includes network latency)
- Uptime: 99.9% (30-day testing period)
- Concurrent Users: 50 tested successfully
- SSL Labs Rating: A+

### Development (Local)
- API Response Time: <200ms (95% of requests)
- Database Query Time: <100ms (10,000 records)
- Dashboard Load Time: <1 second

### Resource Usage (Intel i7, 24GB RAM, Windows 11)
- CPU Usage: 17.6% under load
- Memory Usage: 57.5% (10GB available)
- Database Connections: Pooled efficiently

---

## API STRUCTURE (ACTUAL ENDPOINTS)

### Authentication (/api/auth/)
- POST /login/ - User login
- POST /logout/ - User logout
- POST /2fa/setup/ - Setup 2FA
- POST /2fa/verify/ - Verify 2FA code
- POST /refresh/ - Refresh JWT token

### Users (/api/users/)
- GET /api/users/ - List users (Admin only)
- POST /api/users/ - Create user (Admin only)
- GET /api/users/{id}/ - Get user details
- PUT /api/users/{id}/ - Update user
- DELETE /api/users/{id}/ - Delete user (Admin only)

### Students (/api/students/)
- GET /api/students/ - List students
- POST /api/students/ - Create student (Admin only)
- GET /api/students/{id}/ - Get student details
- PUT /api/students/{id}/ - Update student
- GET /api/students/classrooms/ - List classrooms
- POST /api/students/classrooms/ - Create classroom (Admin only)
- POST /api/students/enrollments/ - Enroll student (Admin only)

### Academics (/api/academics/)
- GET /api/academics/subjects/ - List subjects
- POST /api/academics/subjects/ - Create subject (Admin only)
- GET /api/academics/assignments/ - List teaching assignments
- POST /api/academics/assignments/ - Create assignment (Admin only)

### Attendance (/api/attendance/)
- GET /api/attendance/sessions/ - List sessions
- POST /api/attendance/sessions/ - Create session (Teacher)
- GET /api/attendance/records/ - List records
- POST /api/attendance/records/ - Mark attendance (Teacher)
- GET /api/attendance/reports/ - Attendance reports

### Risk (/api/risk/)
- GET /api/risk/profiles/ - List risk profiles
- GET /api/risk/profiles/{student_id}/ - Get student risk profile

### Alerts (/api/alerts/)
- GET /api/alerts/ - List alerts
- GET /api/alerts/{id}/ - Get alert details
- PATCH /api/alerts/{id}/ - Update alert status (Form Master)

### Interventions (/api/interventions/)
- GET /api/interventions/cases/ - List cases
- POST /api/interventions/cases/ - Create case (Form Master)
- PATCH /api/interventions/cases/{id}/ - Update case
- GET /api/interventions/meetings/ - List meetings
- POST /api/interventions/meetings/ - Create meeting (Form Master)
- POST /api/interventions/meetings/{id}/progress/ - Add progress update

### Dashboard (/api/dashboard/)
- GET /api/dashboard/ - Get role-based dashboard data

### Messages (/api/messages/)
- GET /api/messages/ - List messages
- POST /api/messages/ - Send message
- PATCH /api/messages/{id}/ - Mark as read

### Health (/health/)
- GET /health/ - Health check endpoint

### API Documentation
- GET /api/schema/ - OpenAPI schema
- GET /api/docs/ - Swagger UI
- GET /api/redoc/ - ReDoc

---

## TESTING & QUALITY ASSURANCE (ACTUAL RESULTS)

### Test Suite
- **Total Tests**: 17 automated tests
- **Pass Rate**: 82% (14/17 passing)
- **Code Coverage**: 38% overall
- **High Coverage Modules**:
  - Risk Assessment Services: 94%
  - Dashboard Services: 83%
  - Intervention Models: 84%
  - Attendance Signals: 80%

### Test Categories
- Unit Tests: Model validation, serializer validation
- Integration Tests: API endpoints, authentication flow
- Service Tests: Risk calculation, dashboard aggregation
- Security Tests: RBAC, IDOR protection, rate limiting

### Browser Testing
- Chrome 120+: ✅ Full functionality
- Firefox 121+: ✅ Full functionality
- Edge 120+: ✅ Full functionality
- Safari 17+: ✅ Full functionality

### Device Testing
- Desktop (1920x1080 to 4K): ✅ Full functionality
- Tablet (768px to 1024px): ✅ Full functionality
- Mobile (320px to 767px): ✅ Full functionality

---

## COMPLIANCE & STANDARDS (ACTUAL IMPLEMENTATION)

### Security Standards
- OWASP Top 10: All vulnerabilities addressed
- SSL/TLS: A+ rating (SSL Labs)
- Security Headers: All configured
- Password Policy: 8+ chars, uppercase, lowercase, digit, special

### Data Privacy
- FERPA Compliance: 7-year audit retention
- Student PII Protection: Encrypted in transit (TLS 1.2+)
- Parent Consent: Email notification system
- Data Export: Supported for student records

### Accessibility
- WCAG 2.1 Level AA: Partial compliance
- Keyboard Navigation: Supported
- Screen Reader: Supported
- Color Contrast: 4.5:1 ratio maintained

---

## FUTURE SCALABILITY (PLANNED)

### Horizontal Scaling
- Load balancer (Nginx) → Multiple Gunicorn instances
- Database read replicas for reporting
- Redis cluster for distributed caching
- CDN for static assets

### Multi-Tenancy (Future)
- School-level data isolation
- Subdomain routing (school1.alifmonitor.com)
- Shared database with tenant_id column
- Tenant-specific customization

---

## WRITE THE ARCHITECTURE SECTION

Based on ALL the information above, write Section 3.6 "System Architecture" for a research proposal. Follow this structure:

**3.6 System Architecture**

**3.6.1 Overview**
- Describe the three-tier architecture pattern
- Explain the separation of concerns (presentation, application, data layers)

**3.6.2 Technology Stack**
- Backend technologies and their purposes
- Frontend technologies and their purposes
- Infrastructure and deployment technologies

**3.6.3 Database Architecture**
- Database schema design (11 Django apps, key tables)
- Relationships and constraints
- Indexing strategy for performance

**3.6.4 System Components**
- Backend modules (11 Django apps) and their responsibilities
- Frontend modules (React components) and their organization
- Integration between components

**3.6.5 Data Flow and Workflows**
- Authentication flow (JWT + 2FA)
- Attendance recording workflow
- Risk calculation algorithm (detailed)
- Intervention management workflow

**3.6.6 Security Architecture**
- Authentication and authorization mechanisms
- Middleware stack and security layers
- Input validation and attack prevention
- Audit logging and compliance

**3.6.7 Deployment Architecture**
- Production environment setup (Nginx + Gunicorn + MySQL + Redis)
- Docker containerization (alternative deployment)
- SSL/TLS configuration

**3.6.8 Performance Optimizations**
- Database optimizations (indexes, query optimization, archival)
- Caching strategy (Redis, 5-minute TTL)
- Frontend optimizations (code splitting, lazy loading)

**3.6.9 API Architecture**
- RESTful API design
- Endpoint organization (11 API modules)
- API documentation (Swagger/OpenAPI)

**3.6.10 Quality Assurance**
- Testing strategy (82% pass rate, 38% coverage)
- Browser and device compatibility
- Performance benchmarks (actual measured results)

**IMPORTANT REQUIREMENTS:**
1. Write in academic research style (narrative paragraphs, not bullet points)
2. Use ONLY the information provided above (no exaggeration, no extra features)
3. Be factual and accurate
4. Include actual performance numbers where provided
5. Explain WHY architectural decisions were made (e.g., "JWT tokens stored in httpOnly cookies to prevent XSS attacks")
6. Use proper technical terminology
7. Maintain academic tone throughout
8. Reference actual implementation details (file names, function names, algorithms)
9. Total length: 2000-3000 words
10. Format for research proposal (Section 3.6)

Generate the complete System Architecture section now.
