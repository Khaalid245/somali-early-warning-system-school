# 🐳 Docker Deployment - Ready to Test

## What Was Fixed

### Backend Dockerfile
✅ Added curl for health checks
✅ Increased timeout to 120s
✅ Proper logs directory creation
✅ Added .dockerignore

### Frontend Dockerfile
✅ Multi-stage build (smaller image)
✅ Nginx configuration
✅ Added .dockerignore

### docker-compose.yml
✅ Auto-runs migrations on startup
✅ Uses different ports to avoid conflicts (MySQL: 3307, Redis: 6380)
✅ Hardcoded credentials for easy testing
✅ Proper health checks
✅ Service dependencies configured

### Settings
✅ Added STATIC_ROOT for collectstatic
✅ Environment variables properly configured
✅ Database host set to 'db' for Docker

---

## Quick Start

### Option 1: Automated Test
```bash
test-docker.bat
```

### Option 2: Manual
```bash
cd somali-early-warning-system
docker-compose up --build
```

**Wait 30-60 seconds** for all services to start.

---

## Access Points

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **Health Check:** http://localhost:8000/health/
- **Admin:** http://localhost:8000/admin

---

## Port Configuration

| Service  | Docker Port | Local Port | Conflict-Free |
|----------|-------------|------------|---------------|
| MySQL    | 3307        | 3306       | ✅            |
| Redis    | 6380        | 6379       | ✅            |
| Backend  | 8000        | 8000       | ⚠️            |
| Frontend | 5173        | 5173       | ⚠️            |

**Note:** If ports 8000 or 5173 are in use, stop local dev servers first.

---

## Verification Steps

1. **Check containers running:**
```bash
docker-compose ps
```

Expected: All services "Up" and "healthy"

2. **Check backend health:**
```bash
curl http://localhost:8000/health/
```

Expected: `{"status":"healthy",...}`

3. **Check frontend:**
Open http://localhost:5173 in browser

4. **Check logs:**
```bash
docker-compose logs backend
```

Look for: "Booting worker" (Gunicorn started)

---

## Default Credentials (Docker)

**Database:**
- Host: db (internal) / localhost:3307 (external)
- Database: school_support_db
- User: django_user
- Password: SchoolSupport123

**Redis:**
- URL: redis://redis:6379/0 (internal)
- URL: redis://localhost:6380/0 (external)

---

## Common Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart backend only
docker-compose restart backend

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access backend shell
docker-compose exec backend bash

# Access database
docker-compose exec db mysql -u django_user -pSchoolSupport123 school_support_db
```

---

## Troubleshooting

### Services not starting?
```bash
docker-compose logs
```

### Port conflicts?
Stop local MySQL/Redis or change ports in docker-compose.yml

### Database connection errors?
Wait 30 seconds for MySQL to initialize, then:
```bash
docker-compose restart backend
```

### Frontend not loading?
```bash
docker-compose logs frontend
docker-compose restart frontend
```

### Clean slate?
```bash
docker-compose down -v
docker-compose up --build
```

---

## Files Created for Docker

1. `school_support_backend/Dockerfile` - Backend container
2. `school_support_backend/.dockerignore` - Exclude files
3. `school_support_frontend/Dockerfile` - Frontend container
4. `school_support_frontend/.dockerignore` - Exclude files
5. `school_support_frontend/nginx.conf` - Nginx config
6. `docker-compose.yml` - Orchestration
7. `test-docker.bat` - Automated test script
8. `DOCKER_TESTING.md` - Detailed guide

---

## Production Deployment

For production, update docker-compose.yml:

```yaml
environment:
  - DEBUG=False
  - SECRET_KEY=${SECRET_KEY}
  - DB_PASSWORD=${DB_PASSWORD}
  - ALLOWED_HOSTS=yourdomain.com
```

And create `.env` file with secure credentials.

---

## Testing Checklist

- [ ] Run `test-docker.bat`
- [ ] All containers start successfully
- [ ] Health check returns healthy
- [ ] Frontend loads at http://localhost:5173
- [ ] Can login to application
- [ ] Backend API responds
- [ ] No errors in logs

---

## Next Steps

1. **Test locally:** Run `test-docker.bat`
2. **Verify all services:** Check health endpoint
3. **Test application:** Login and test features
4. **Review logs:** Check for any errors
5. **Deploy to cloud:** Use docker-compose.yml as base

---

## Support

- **Detailed Guide:** See `DOCKER_TESTING.md`
- **Quick Reference:** See `QUICK_REFERENCE.md`
- **Full Documentation:** See `PRODUCTION_IMPROVEMENTS.md`

---

**Docker setup is ready for testing! Run `test-docker.bat` to start.** 🚀
