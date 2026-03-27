# 🔧 Fix Deployment Issues - Step by Step Guide

## Issue 1: Email Credentials - What's Wrong?

### The Problem:
Your `docker-compose.production.yml` has **placeholder values** for email:

```yaml
- EMAIL_HOST_USER=your-email@gmail.com  # ← This is NOT a real email
- EMAIL_HOST_PASSWORD=your-app-password  # ← This is NOT a real password
```

### Why This is a Problem:
- Password reset emails won't work
- Attendance reminder emails won't send
- Notification emails will fail silently
- Users can't recover their accounts

### What You Need:
1. **Your Gmail address** (e.g., khalid@gmail.com)
2. **Gmail App Password** (NOT your regular Gmail password)

---

## 📧 How to Get Gmail App Password (5 minutes)

### Step 1: Go to Google Account Security
1. Open: https://myaccount.google.com/security
2. Sign in with your Gmail account

### Step 2: Enable 2-Step Verification (if not already enabled)
1. Scroll to "How you sign in to Google"
2. Click "2-Step Verification"
3. Follow the setup wizard
4. Verify with your phone

### Step 3: Generate App Password
1. Go back to: https://myaccount.google.com/security
2. Scroll to "How you sign in to Google"
3. Click "App passwords" (or "2-Step Verification" → "App passwords")
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Type: "School Support System"
7. Click "Generate"
8. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 4: Update docker-compose.production.yml

Replace these lines:
```yaml
# BEFORE (Line 67-68)
- EMAIL_HOST_USER=your-email@gmail.com
- EMAIL_HOST_PASSWORD=your-app-password

# AFTER (use YOUR actual values)
- EMAIL_HOST_USER=khalid@gmail.com  # Your real Gmail
- EMAIL_HOST_PASSWORD=abcdefghijklmnop  # Your 16-char app password (no spaces)
```

**IMPORTANT:** Remove spaces from the app password!
- Google shows: `abcd efgh ijkl mnop`
- You type: `abcdefghijklmnop`

---

## 🔌 Issue 2: Port Conflict - How to Fix

### The Problem:
Port 3307 is already in use by another MySQL container (alif-db).

### Solution: Change Port to 3308

Edit `docker-compose.production.yml`:

```yaml
# BEFORE (Line 11)
ports:
  - "3307:3306"

# AFTER
ports:
  - "3308:3306"
```

This changes the external port from 3307 to 3308 (internal port stays 3306).

---

## ✅ Quick Fix Commands

### Option 1: Manual Edit (Recommended)

1. Open `docker-compose.production.yml` in a text editor
2. Change line 11: `"3307:3306"` → `"3308:3306"`
3. Change line 67: `your-email@gmail.com` → your real Gmail
4. Change line 68: `your-app-password` → your 16-char app password
5. Repeat for lines 115-116 (scheduler section)
6. Save the file

### Option 2: Use Find & Replace

**For Email:**
- Find: `your-email@gmail.com`
- Replace with: `your-actual-email@gmail.com`

- Find: `your-app-password`
- Replace with: `your16charappppassword`

**For Port:**
- Find: `"3307:3306"`
- Replace with: `"3308:3306"`

---

## 🧪 Test Your Changes

After making changes, validate the configuration:

```bash
cd c:\Users\Khalid\somali-early-warning-system-school\somali-early-warning-system

# Validate syntax
docker-compose -f docker-compose.production.yml config

# Should show no errors
```

---

## 📋 Checklist Before Deployment

- [ ] Gmail App Password generated
- [ ] Email credentials updated in docker-compose.production.yml (2 places: backend + scheduler)
- [ ] Port changed from 3307 to 3308
- [ ] Configuration validated with `docker-compose config`
- [ ] No syntax errors

---

## 🚀 After Fixing - Deploy Locally

```bash
# 1. Copy production config
cp docker-compose.production.yml docker-compose.yml

# 2. Stop old containers
docker-compose down

# 3. Start with new config
docker-compose up --build -d

# 4. Check all containers running
docker-compose ps

# Expected output:
# NAME                        STATUS
# school_support_backend      Up
# school_support_db           Up (healthy)
# school_support_frontend     Up
# school_support_redis        Up (healthy)
# school_support_scheduler    Up

# 5. Check backend logs
docker-compose logs -f backend

# Look for:
# ✅ "Booting worker with pid"
# ✅ "Listening at: http://0.0.0.0:8000"
# ❌ No errors about email or database
```

---

## 🧪 Test Email Configuration

After deployment, test if email works:

```bash
# Access backend container
docker-compose exec backend python manage.py shell

# In Python shell, test email:
from django.core.mail import send_mail

send_mail(
    'Test Email',
    'This is a test from School Support System',
    'noreply@alifmonitor.com',
    ['your-email@gmail.com'],
    fail_silently=False,
)

# Press Ctrl+D to exit

# Check your Gmail inbox for the test email
```

---

## ❓ Common Issues

### Issue: "App passwords" option not showing
**Solution:** Enable 2-Step Verification first

### Issue: Email still not working
**Solution:** 
1. Check you removed spaces from app password
2. Verify Gmail allows "Less secure app access" (usually not needed with app passwords)
3. Check backend logs: `docker-compose logs backend | grep -i email`

### Issue: Port 3308 also in use
**Solution:** Use port 3309 instead:
```yaml
ports:
  - "3309:3306"
```

---

## 📊 Summary

| Issue | Fix | Time |
|-------|-----|------|
| Email credentials | Get Gmail App Password & update config | 5 min |
| Port conflict | Change 3307 → 3308 | 1 min |
| **Total** | **Both issues fixed** | **6 min** |

---

## ✅ After Fixing Both Issues

Your system will be **100% ready** for deployment! 🎉

Next steps:
1. Test locally (5 minutes)
2. If successful, deploy to new server (30 minutes)
3. Update DNS to point to new server (5 minutes)
4. Install SSL certificate (10 minutes)
5. Monitor for 48 hours
6. Shut down old server

---

## 🆘 Need Help?

If you get stuck:
1. Check the error message in: `docker-compose logs backend`
2. Verify your changes with: `docker-compose config`
3. Make sure no typos in email or password
4. Ensure app password has no spaces

---

**Ready to fix these issues?** Follow the steps above and you'll be deployment-ready in 6 minutes! 🚀
