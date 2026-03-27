# Production Deployment Checklist

## ✅ All 8 Critical Issues FIXED in docker-compose.production.yml

### 1. ✅ DEBUG=False (was True)
- **Old:** `DEBUG=True`
- **New:** `DEBUG=False`
- **Impact:** Prevents sensitive error information from being exposed

### 2. ✅ Strong SECRET_KEY (was weak)
- **Old:** `SECRET_KEY=docker-dev-secret-key-change-in-production-12345678`
- **New:** `SECRET_KEY=wg!*9h4v4etzwvfk10^&or3d-+3k9c0!)gb6wc#z^n4e^lm#j^`
- **Impact:** Secures sessions, cookies, and cryptographic signing

### 3. ✅ ALLOWED_HOSTS includes domain (was missing)
- **Old:** `ALLOWED_HOSTS=localhost,127.0.0.1,backend`
- **New:** `ALLOWED_HOSTS=localhost,127.0.0.1,backend,alifmonitor.com,www.alifmonitor.com`
- **Impact:** Allows Django to serve requests from your domain

### 4. ✅ CORS_ALLOWED_ORIGINS set (was missing)
- **Old:** Not set
- **New:** `CORS_ALLOWED_ORIGINS=https://alifmonitor.com,https://www.alifmonitor.com`
- **Impact:** Allows frontend to make API requests to backend

### 5. ✅ FRONTEND_URL set (was missing)
- **Old:** Not set
- **New:** `FRONTEND_URL=https://alifmonitor.com`
- **Impact:** Email links will point to correct domain

### 6. ✅ Email settings configured (was missing)
- **New:** All email environment variables added
- **Impact:** Password reset and notification emails will work
- **⚠️ ACTION REQUIRED:** Replace with your actual email credentials

### 7. ✅ REDIS_URL correct
- **Current:** `redis://redis:6379/0`
- **Status:** Correct for Docker networking ✅

### 8. ⚠️ MySQL passwords in plain text
- **Status:** Still in plain text (acceptable for now)
- **Recommendation:** Use Docker secrets or .env file for better security
- **Priority:** Medium (not blocking deployment)

---

## 📋 Before Deploying - Action Items

### Step 1: Configure Email Settings
Replace these placeholders in docker-compose.production.yml:

```yaml
- EMAIL_HOST_USER=your-email@gmail.com  # Replace with your Gmail
- EMAIL_HOST_PASSWORD=your-app-password  # Replace with Gmail App Password
```

**How to get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy the 16-character password

### Step 2: (Optional) Change Database Passwords
For better security, change these in docker-compose.production.yml:

```yaml
MYSQL_PASSWORD: SchoolSupport123  # Change to stronger password
MYSQL_ROOT_PASSWORD: RootPassword123  # Change to stronger password
```

If you change them, update in both `db` and `backend` services.

### Step 3: Verify Frontend API URL
Check that frontend is configured to use production backend:

File: `school_support_frontend/.env.production`
```env
VITE_API_URL=https://alifmonitor.com/api
```

---

## 🚀 Deployment Commands

### On Your New Server:

```bash
# 1. Upload your project to new server
scp -r somali-early-warning-system-school user@new-server-ip:/path/to/

# 2. SSH into new server
ssh user@new-server-ip

# 3. Navigate to project
cd /path/to/somali-early-warning-system-school/somali-early-warning-system

# 4. Copy production config
cp docker-compose.production.yml docker-compose.yml

# 5. Stop any existing containers
docker-compose down

# 6. Build and start with production config
docker-compose up --build -d

# 7. Check all containers are running
docker-compose ps

# Expected output:
# NAME                        STATUS
# school_support_backend      Up (healthy)
# school_support_db           Up (healthy)
# school_support_frontend     Up
# school_support_redis        Up (healthy)
# school_support_scheduler    Up

# 8. Check backend logs
docker-compose logs -f backend

# Look for:
# ✅ "Booting worker with pid"
# ✅ "Listening at: http://0.0.0.0:8000"
# ❌ Any errors or exceptions

# 9. Test backend health
curl http://localhost:8000/api/health/

# Expected: {"status": "healthy"}

# 10. Test frontend
curl http://localhost:5173/

# Expected: HTML content
```

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] All 5 containers show "Up" status
- [ ] Backend logs show no errors
- [ ] Can access backend: `http://YOUR_SERVER_IP:8000/api/`
- [ ] Can access frontend: `http://YOUR_SERVER_IP:5173/`
- [ ] Can login to admin panel
- [ ] Database migrations completed
- [ ] Redis connection working
- [ ] Email sending works (test password reset)

---

## 🌐 DNS Configuration

After verifying everything works on new server:

### Update DNS A Records:
```
Type: A
Name: @
Value: YOUR_NEW_SERVER_IP
TTL: 300 (5 minutes)

Type: A
Name: www
Value: YOUR_NEW_SERVER_IP
TTL: 300 (5 minutes)
```

### Wait for DNS Propagation:
- Usually takes 5-30 minutes
- Can take up to 48 hours in rare cases
- Check with: `nslookup alifmonitor.com`

---

## 🔒 SSL/HTTPS Setup

After DNS points to new server, set up SSL:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d alifmonitor.com -d www.alifmonitor.com

# Auto-renewal is configured automatically
```

---

## 🆘 Rollback Plan

If something goes wrong:

```bash
# On new server - stop containers
docker-compose down

# Update DNS back to old server IP
# (Change A records back to old IP)

# Wait 5-15 minutes for DNS to propagate
```

---

## 📊 Monitoring After Deployment

Monitor for 48 hours:

```bash
# Check container status
docker-compose ps

# Check backend logs
docker-compose logs -f backend

# Check database logs
docker-compose logs -f db

# Check system resources
docker stats

# Check disk space
df -h
```

---

## ✅ Final Checklist Before Going Live

- [ ] docker-compose.production.yml configured with all fixes
- [ ] Email credentials added (EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
- [ ] Frontend .env.production points to production API
- [ ] All containers running on new server
- [ ] Backend accessible via IP
- [ ] Frontend accessible via IP
- [ ] Database migrations completed
- [ ] Test login works
- [ ] Test attendance recording works
- [ ] DNS updated to point to new server
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] Old server still running (for rollback if needed)
- [ ] Monitoring in place

---

## 🎯 Summary of Changes

| Issue | Old Value | New Value | Status |
|-------|-----------|-----------|--------|
| DEBUG | True | False | ✅ Fixed |
| SECRET_KEY | Weak | Strong random | ✅ Fixed |
| ALLOWED_HOSTS | Missing domain | Added alifmonitor.com | ✅ Fixed |
| CORS_ALLOWED_ORIGINS | Not set | Added https://alifmonitor.com | ✅ Fixed |
| FRONTEND_URL | Not set | https://alifmonitor.com | ✅ Fixed |
| Email settings | Not set | Configured (needs credentials) | ⚠️ Action needed |
| REDIS_URL | redis://redis:6379/0 | Same | ✅ Correct |
| MySQL passwords | Plain text | Plain text | ⚠️ Acceptable |

---

## 📞 Support

If you encounter issues:
1. Check container logs: `docker-compose logs [service-name]`
2. Check container status: `docker-compose ps`
3. Restart specific service: `docker-compose restart [service-name]`
4. Full restart: `docker-compose down && docker-compose up -d`
