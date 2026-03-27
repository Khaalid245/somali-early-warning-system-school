# Configuration Changes: Development → Production

## 🔴 CRITICAL SECURITY FIXES

### 1. DEBUG Mode
```yaml
# ❌ OLD (DANGEROUS)
- DEBUG=True

# ✅ NEW (SECURE)
- DEBUG=False
```
**Why:** DEBUG=True exposes sensitive information like database queries, secret keys, and full error tracebacks to users.

---

### 2. SECRET_KEY
```yaml
# ❌ OLD (INSECURE)
- SECRET_KEY=docker-dev-secret-key-change-in-production-12345678

# ✅ NEW (SECURE)
- SECRET_KEY=wg!*9h4v4etzwvfk10^&or3d-+3k9c0!)gb6wc#z^n4e^lm#j^
```
**Why:** Weak secret keys can be guessed, allowing attackers to forge sessions and decrypt sensitive data.

---

### 3. ALLOWED_HOSTS
```yaml
# ❌ OLD (INCOMPLETE)
- ALLOWED_HOSTS=localhost,127.0.0.1,backend

# ✅ NEW (COMPLETE)
- ALLOWED_HOSTS=localhost,127.0.0.1,backend,alifmonitor.com,www.alifmonitor.com
```
**Why:** Django will reject requests from alifmonitor.com without this, causing "Bad Request (400)" errors.

---

### 4. CORS_ALLOWED_ORIGINS
```yaml
# ❌ OLD (MISSING)
# Not set at all

# ✅ NEW (CONFIGURED)
- CORS_ALLOWED_ORIGINS=https://alifmonitor.com,https://www.alifmonitor.com
```
**Why:** Frontend cannot make API requests to backend without this. All API calls will fail with CORS errors.

---

### 5. FRONTEND_URL
```yaml
# ❌ OLD (MISSING)
# Not set at all

# ✅ NEW (CONFIGURED)
- FRONTEND_URL=https://alifmonitor.com
```
**Why:** Email links (password reset, notifications) will be broken without this.

---

### 6. Email Configuration
```yaml
# ❌ OLD (MISSING)
# Not set at all

# ✅ NEW (CONFIGURED)
- EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
- EMAIL_HOST=smtp.gmail.com
- EMAIL_PORT=587
- EMAIL_USE_TLS=True
- EMAIL_HOST_USER=your-email@gmail.com
- EMAIL_HOST_PASSWORD=your-app-password
- DEFAULT_FROM_EMAIL=noreply@alifmonitor.com
```
**Why:** Password reset, attendance reminders, and notifications won't work without email configuration.

---

## 📁 Files Created

1. **docker-compose.production.yml** - Production-ready configuration with all fixes
2. **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment guide
3. **CONFIGURATION_CHANGES.md** - This file (comparison document)

---

## ⚠️ TODO Before Deployment

### Required Actions:

1. **Add Email Credentials** (REQUIRED)
   - Replace `your-email@gmail.com` with your Gmail address
   - Replace `your-app-password` with Gmail App Password
   - See DEPLOYMENT_CHECKLIST.md for instructions

2. **Verify Frontend Configuration** (REQUIRED)
   - Check `school_support_frontend/.env.production`
   - Ensure `VITE_API_URL=https://alifmonitor.com/api`

3. **Change Database Passwords** (RECOMMENDED)
   - Replace `SchoolSupport123` with stronger password
   - Replace `RootPassword123` with stronger password
   - Update in both `db` and `backend` services

---

## 🚀 Quick Start

```bash
# 1. Copy production config
cp docker-compose.production.yml docker-compose.yml

# 2. Edit email settings
nano docker-compose.yml
# Replace EMAIL_HOST_USER and EMAIL_HOST_PASSWORD

# 3. Deploy
docker-compose down
docker-compose up --build -d

# 4. Verify
docker-compose ps
docker-compose logs -f backend
```

---

## 🔍 What Will Break Without These Fixes

| Missing Fix | What Breaks | Severity |
|-------------|-------------|----------|
| DEBUG=False | Exposes sensitive data | 🔴 Critical |
| SECRET_KEY | Sessions can be hijacked | 🔴 Critical |
| ALLOWED_HOSTS | Site returns 400 errors | 🔴 Critical |
| CORS_ALLOWED_ORIGINS | Frontend can't call API | 🔴 Critical |
| FRONTEND_URL | Email links broken | 🟡 High |
| Email settings | No emails sent | 🟡 High |

---

## ✅ What's Already Correct

- ✅ REDIS_URL format is correct
- ✅ Database connection settings are correct
- ✅ Container networking is configured properly
- ✅ Health checks are in place
- ✅ Restart policies added (unless-stopped)

---

## 📊 Security Score

| Aspect | Before | After |
|--------|--------|-------|
| Debug Mode | 🔴 Exposed | ✅ Disabled |
| Secret Key | 🔴 Weak | ✅ Strong |
| Host Protection | 🔴 Incomplete | ✅ Complete |
| CORS Protection | 🔴 Missing | ✅ Configured |
| Email Security | 🟡 Not configured | ⚠️ Needs credentials |
| Overall | 🔴 Not Production Ready | ✅ Production Ready* |

*After adding email credentials
