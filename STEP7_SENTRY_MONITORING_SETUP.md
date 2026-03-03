# Step 7: Sentry Monitoring Setup

## What is Sentry?

Sentry automatically captures:
- ✅ Frontend errors (React crashes)
- ✅ Backend errors (Django exceptions)
- ✅ Performance issues (slow API calls)
- ✅ User sessions (what user did before error)

**Free tier:** 100,000 events/month

---

## Setup Instructions

### 1. Create Sentry Account

1. Go to: https://sentry.io/signup/
2. Sign up (free account)
3. Create organization (e.g., "School Support System")

### 2. Create Backend Project

1. Click "Create Project"
2. Select platform: **Django**
3. Name: "school-support-backend"
4. Copy the DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 3. Create Frontend Project

1. Click "Create Project" again
2. Select platform: **React**
3. Name: "school-support-frontend"
4. Copy the DSN

### 4. Configure Backend

Add to `school_support_backend/.env`:

```env
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
ENVIRONMENT=production
```

Restart Django server:
```bash
python manage.py runserver
```

### 5. Configure Frontend

Add to `school_support_frontend/.env`:

```env
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
VITE_ENVIRONMENT=production
```

Install Sentry:
```bash
cd school_support_frontend
npm install @sentry/react
```

Restart frontend:
```bash
npm run dev
```

---

## Test It Works

### Test Backend Error Tracking:

1. Go to Django shell:
```bash
python manage.py shell
```

2. Trigger test error:
```python
from sentry_sdk import capture_message
capture_message("Test error from Django!")
```

3. Check Sentry dashboard → Should see the message

### Test Frontend Error Tracking:

1. Open browser console
2. Run:
```javascript
throw new Error("Test error from React!");
```

3. Check Sentry dashboard → Should see the error

---

## What You'll See in Sentry

### Error Details:
- Error message and stack trace
- User who experienced error
- Browser/device information
- URL where error occurred
- User actions before error (breadcrumbs)

### Performance Monitoring:
- Slow API calls
- Page load times
- Database query performance
- Transaction traces

### Alerts:
- Email when new error occurs
- Slack notifications (optional)
- Weekly summary reports

---

## Benefits

### For Development:
- ✅ See errors immediately
- ✅ Know which users affected
- ✅ Reproduce bugs easily
- ✅ Track error frequency

### For Production:
- ✅ Catch errors before users report
- ✅ Fix critical bugs fast
- ✅ Monitor performance
- ✅ Improve user experience

---

## Optional: Add to AuthContext

Track user context in errors:

```javascript
// In AuthContext.jsx
import { setUserContext, clearUserContext } from '../utils/sentry';

const login = (access, refresh) => {
  // ... existing code
  const decoded = jwtDecode(access);
  setUser(decoded);
  
  // Track user in Sentry
  setUserContext(decoded);
};

const logout = async () => {
  // ... existing code
  
  // Clear user from Sentry
  clearUserContext();
};
```

---

## Files Modified/Created

### Backend:
- `.env.example` - Added SENTRY_DSN
- `settings.py` - Already configured ✅

### Frontend:
- `package.json` - Added @sentry/react
- `src/utils/sentry.js` - Sentry configuration
- `src/main.jsx` - Initialize Sentry
- `.env.example` - Added VITE_SENTRY_DSN

---

## Cost

**Free Tier:**
- 100,000 events/month
- 1 GB session replays
- 30-day data retention
- Unlimited projects

**Paid (if needed):**
- $26/month for 500k events
- 90-day retention
- Priority support

---

## Next Steps

1. Create Sentry account
2. Get DSN for backend and frontend
3. Add to .env files
4. Install frontend package: `npm install @sentry/react`
5. Test error tracking
6. Check Sentry dashboard

---

**Status:** Implementation complete, ready for configuration!
**Time:** 15 minutes setup + testing
**Priority:** HIGH for production
