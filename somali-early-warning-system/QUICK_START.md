# 🚀 Quick Deployment Guide

## ✅ What Was Fixed

All 8 critical production issues have been fixed in `docker-compose.production.yml`:

1. ✅ DEBUG=False (was True)
2. ✅ Strong SECRET_KEY (was weak)
3. ✅ ALLOWED_HOSTS includes alifmonitor.com
4. ✅ CORS_ALLOWED_ORIGINS configured
5. ✅ FRONTEND_URL set
6. ✅ Email settings added (needs your credentials)
7. ✅ REDIS_URL correct
8. ✅ Restart policies added

## ⚠️ Before You Deploy - 2 REQUIRED Actions

### 1. Add Your Email Credentials

Edit `docker-compose.production.yml` and replace:

```yaml
- EMAIL_HOST_USER=your-email@gmail.com  # ← Replace this
- EMAIL_HOST_PASSWORD=your-app-password  # ← Replace this
```

**How to get Gmail App Password:**
- Google Account → Security → 2-Step Verification → App Passwords
- Generate password for "Mail"
- Use the 16-character password

### 2. Verify Frontend Configuration

Check `school_support_frontend/.env.production`:

```env
VITE_API_URL=https://alifmonitor.com/api
```

## 🚀 Deploy in 5 Commands

```bash
# 1. Copy production config
cp docker-compose.production.yml docker-compose.yml

# 2. Stop old containers
docker-compose down

# 3. Build and start
docker-compose up --build -d

# 4. Check status
docker-compose ps

# 5. Check logs
docker-compose logs -f backend
```

## ✅ Verify Deployment

All containers should show "Up":
```
NAME                        STATUS
school_support_backend      Up
school_support_db           Up (healthy)
school_support_frontend     Up
school_support_redis        Up (healthy)
school_support_scheduler    Up
```

Test backend:
```bash
curl http://localhost:8000/api/health/
# Expected: {"status": "healthy"}
```

Test frontend:
```bash
curl http://localhost:5173/
# Expected: HTML content
```

## 🌐 After Deployment - Update DNS

Point your domain to new server:

```
Type: A
Name: @
Value: YOUR_NEW_SERVER_IP
TTL: 300

Type: A
Name: www
Value: YOUR_NEW_SERVER_IP
TTL: 300
```

## 🔒 Install SSL Certificate

```bash
sudo certbot --nginx -d alifmonitor.com -d www.alifmonitor.com
```

## 📁 Files Created

1. `docker-compose.production.yml` - Production config with all fixes
2. `DEPLOYMENT_CHECKLIST.md` - Detailed step-by-step guide
3. `CONFIGURATION_CHANGES.md` - Before/after comparison
4. `verify-deployment.sh` - Automated verification script
5. `QUICK_START.md` - This file

## 🆘 If Something Goes Wrong

```bash
# View logs
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend

# Full restart
docker-compose down && docker-compose up -d

# Rollback: Update DNS back to old server IP
```

## 📞 Need Help?

Check the detailed guides:
- `DEPLOYMENT_CHECKLIST.md` - Full deployment process
- `CONFIGURATION_CHANGES.md` - What changed and why
- Container logs: `docker-compose logs [service-name]`

## 🎯 Success Criteria

- [ ] All 5 containers running
- [ ] Backend returns HTTP 200 on /api/health/
- [ ] Frontend loads successfully
- [ ] Can login to system
- [ ] Email credentials configured
- [ ] DNS points to new server
- [ ] SSL certificate installed
- [ ] HTTPS working

---

**Ready to deploy?** Follow the "Deploy in 5 Commands" section above!
