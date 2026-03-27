# PROMPT: Generate System Architecture from Project Analysis

## INSTRUCTIONS

You are a senior software architect analyzing a real, deployed project. Your task is to write **Section 3.6 "System Architecture"** for a research proposal.

---

## PROJECT TO ANALYZE

**Project Name**: School Early Warning Support System  
**Location**: `c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system\`  
**Live Deployment**: https://www.alifmonitor.com  

---

## YOUR TASK

### Step 1: READ AND ANALYZE THE PROJECT

Read these files to understand the ACTUAL implementation:

**Backend (Django):**
- `school_support_backend/school_support_backend/settings.py` - Configuration, middleware, security
- `school_support_backend/school_support_backend/urls.py` - API routing structure
- `school_support_backend/requirements.txt` - All dependencies and versions
- `school_support_backend/*/models.py` - Database schema (all apps: users, students, attendance, risk, alerts, interventions, academics, messaging)
- `school_support_backend/*/views.py` - API endpoints and business logic
- `school_support_backend/*/services.py` - Core algorithms (especially risk/services.py, dashboard/services.py)
- `school_support_backend/*/signals.py` - Event-driven workflows (especially attendance/signals.py)
- `school_support_backend/core/*` - Security middleware, authentication, permissions

**Frontend (React):**
- `school_support_frontend/package.json` - All dependencies and versions
- `school_support_frontend/vite.config.js` - Build configuration
- `school_support_frontend/src/` - Component structure (admin/, teacher/, formMaster/, auth/, components/)

**Infrastructure:**
- `docker-compose.yml` - Deployment architecture
- `README.md` - System overview, testing results, performance benchmarks

---

### Step 2: CRITICAL RULES

**DO:**
✅ Base EVERYTHING on actual code you read  
✅ Use exact version numbers from package.json and requirements.txt  
✅ Reference actual file names, function names, class names  
✅ Include actual performance data from README (2.16s load time, 99.9% uptime, 82% test pass rate)  
✅ Describe the ACTUAL risk calculation algorithm from risk/services.py  
✅ Explain the ACTUAL data flow from signals.py  
✅ List the ACTUAL 11 Django apps and their purposes  
✅ Describe the ACTUAL middleware stack from settings.py  
✅ Write in academic research style (narrative paragraphs, not bullets)  

**DO NOT:**
❌ Add features that don't exist in the code  
❌ Exaggerate capabilities  
❌ Mention technologies not in requirements.txt or package.json  
❌ Invent performance numbers - use only what's in README  
❌ Add "planned features" unless explicitly marked as such in README  
❌ Use generic descriptions - be specific to THIS project  

---

### Step 3: WRITE THE ARCHITECTURE SECTION

Write **Section 3.6 "System Architecture"** with these subsections:

**3.6.1 Architectural Overview**
- Describe the three-tier architecture (presentation, application, data layers)
- Explain how components interact

**3.6.2 Technology Stack**
- Backend: Django version, Python version, all major libraries from requirements.txt
- Frontend: React version, Vite, all major libraries from package.json
- Infrastructure: Docker, Nginx, MySQL, Redis (from docker-compose.yml)

**3.6.3 Database Design**
- Describe the 11 Django apps and their database models
- Explain key relationships (User → Classroom, Student → Enrollment, etc.)
- Mention indexing strategy for performance

**3.6.4 Backend Architecture**
- Describe the 11 Django apps: core, users, students, academics, attendance, risk, alerts, interventions, dashboard, messaging, notifications
- Explain the middleware stack from settings.py
- Describe the security layers (JWT, 2FA, rate limiting, RBAC)

**3.6.5 Frontend Architecture**
- Describe React component organization (admin/, teacher/, formMaster/)
- Explain routing and state management
- Mention UI libraries (Tailwind CSS, Recharts, etc.)

**3.6.6 Core Workflows**
- **Authentication Flow**: JWT + 2FA process
- **Attendance Recording**: Teacher marks attendance → triggers risk calculation
- **Risk Assessment Algorithm**: Read from risk/services.py and explain the EXACT algorithm:
  - Subject-level metrics calculation
  - Consecutive absence streak detection
  - Risk score calculation with EXACT point values (+15, +25, +40)
  - Risk level classification (Low: 0-29, Medium: 30-54, High: 55-74, Critical: 75+)
  - Auto-alert and auto-case creation
- **Intervention Workflow**: Form Master creates meeting → adds progress → closes case

**3.6.7 Security Architecture**
- Authentication: JWT in httpOnly cookies, 2FA with TOTP
- Authorization: RBAC with role-based permissions
- Middleware: List the actual middleware from settings.py in order
- Input validation: XSS prevention, SQL injection protection
- Audit logging: 7-year retention for FERPA compliance

**3.6.8 Deployment Architecture**
- Production: Nginx → Gunicorn (3 workers) → Django → MySQL + Redis
- Docker: 4 services (db, redis, backend, frontend) from docker-compose.yml
- SSL/TLS: Let's Encrypt certificates

**3.6.9 Performance Optimization**
- Database: Indexes, query optimization (select_related, prefetch_related), archival (2+ years)
- Caching: Redis with 5-minute TTL for dashboard data
- Frontend: Code splitting, lazy loading, virtual scrolling

**3.6.10 Quality Assurance**
- Testing: 17 tests, 82% pass rate, 38% overall coverage, 94% coverage for critical modules
- Performance: 2.16s page load, 99.9% uptime, 17.6% CPU usage under load
- Browser compatibility: Chrome 120+, Firefox 121+, Edge 120+, Safari 17+

---

### Step 4: FORMATTING REQUIREMENTS

- **Style**: Academic research proposal (narrative paragraphs, not bullet points)
- **Length**: 2000-3000 words
- **Tone**: Professional, factual, technical but accessible
- **Citations**: Reference actual file names when describing implementation
- **Accuracy**: Every statement must be verifiable in the codebase

---

## EXAMPLE OF GOOD VS BAD WRITING

**❌ BAD (Generic, Exaggerated):**
"The system uses advanced machine learning algorithms to predict student dropout with 99% accuracy using neural networks and deep learning models."

**✅ GOOD (Specific, Accurate):**
"The system calculates student risk scores using a rule-based algorithm implemented in risk/services.py. The algorithm computes subject-level absence rates, detects consecutive absence streaks, and applies weighted point adjustments: +15 points for 3+ consecutive absences, +25 points for 5+ absences, and +40 points for 7+ absences. Risk levels are classified as Low (0-29 points), Medium (30-54 points), High (55-74 points), or Critical (75+ points)."

---

## START WRITING

Now, read the project files and write Section 3.6 "System Architecture" following all the rules above.

Remember:
1. Read the actual code first
2. Base everything on what you read
3. Don't add features that don't exist
4. Use exact version numbers and file names
5. Write in academic style
6. Be specific and accurate

Begin writing now.
