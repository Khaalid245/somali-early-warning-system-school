# 🐳 Docker Testing & Troubleshooting Guide

## Quick Test

```bash
# From project root (somali-early-warning-system/)
docker-compose up --build
```

**Expected Output:**
- MySQL starts on port 3307
- Redis starts on port 6380
- Backend runs migrations and starts on port 8000
- Frontend builds and serves on port 5173

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Health: http://localhost:8000/health/

---

## Step-by-Step Testing

### 1. Test Backend Build
```bash
cd school_support_backend
docker build -t school-backend .
```

**Expected:** Build succeeds without errors

### 2. Test Frontend Build
```bash
cd school_support_frontend
docker build -t school-frontend .
```

**Expected:** Build succeeds, creates nginx image

### 3. Test Full Stack
```bash
cd ..
docker-compose up
```

**Watch for:**
- ✅ MySQL: "ready for connections"
- ✅ Redis: "Ready to accept connections"
- ✅ Backend: "Booting worker" (Gunicorn)
- ✅ Frontend: nginx starts

---

## Common Issues & Fixes

### Issue 1: Port Already in Use
**Error:** `Bind for 0.0.0.0:3306 failed: port is already allocated`

**Fix:**
```bash
# Stop local MySQL
net stop MySQL80

# Or use different ports (already configured):
# MySQL: 3307 (instead of 3306)
# Redis: 6380 (instead of 6379)
```

### Issue 2: Database Connection Failed
**Error:** `Can't connect to MySQL server on 'db'`

**Fix:**
```bash
# Wait for MySQL to be ready (takes 10-30 seconds)
docker-compose logs db

# Look for: "ready for connections"
```

### Issue 3: Migration Errors
**Error:** `django.db.utils.OperationalError`

**Fix:**
```bash
# Run migrations manually
docker-compose exec backend python manage.py migrate

# Or restart services
docker-compose restart backend
```

### Issue 4: Frontend Build Fails
**Error:** `npm install` fails

**Fix:**
```bash
# Clear npm cache locally first
cd school_support_frontend
rm -rf node_modules package-lock.json
npm install

# Then rebuild Docker
docker-compose build frontend
```

### Issue 5: CORS Errors
**Error:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Fix:** Already configured in settings.py with DEBUG=True

---

## Verification Checklist

### Backend Health
```bash
# Check backend logs
docker-compose logs backend

# Test health endpoint
curl http://localhost:8000/health/

# Expected response:
# {"status":"healthy","timestamp":...,"checks":{"database":"ok","cache":"ok"}}
```

### Database Connection
```bash
# Connect to MySQL
docker-compose exec db mysql -u django_user -pSchoolSupport123 school_support_db

# Run query
mysql> SHOW TABLES;
mysql> exit
```

### Redis Connection
```bash
# Test Redis
docker-compose exec redis redis-cli ping

# Expected: PONG
```

### Frontend
```bash
# Check if frontend is serving
curl http://localhost:5173

# Should return HTML
```

---

## Useful Commands

### View Logs
```bash
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only
docker-compose logs -f db           # Database only
```

### Execute Commands in Containers
```bash
# Backend shell
docker-compose exec backend bash

# Run Django commands
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py shell
```

### Restart Services
```bash
docker-compose restart backend      # Restart backend only
docker-compose restart              # Restart all
```

### Stop & Clean
```bash
docker-compose down                 # Stop services
docker-compose down -v              # Stop and remove volumes
docker system prune -a              # Clean everything
```

---

## Production Deployment Notes

### For Production, Update:

1. **docker-compose.yml:**
```yaml
environment:
  - DEBUG=False
  - ALLOWED_HOSTS=yourdomain.com
  - SECRET_KEY=generate-new-key
```

2. **Use .env file:**
```bash
# Create .env in project root
DB_PASSWORD=strong-password
DB_ROOT_PASSWORD=strong-root-password
SECRET_KEY=your-secret-key
```

3. **Enable SSL:**
- Add nginx SSL configuration
- Use Let's Encrypt certificates
- Update CORS_ALLOWED_ORIGINS

---

## Performance Tips

### Optimize Build Time
```bash
# Use build cache
docker-compose build --parallel

# Build specific service
docker-compose build backend
```

### Monitor Resources
```bash
# Check container stats
docker stats

# Check disk usage
docker system df
```

---

## Testing Workflow

1. **Start fresh:**
```bash
docker-compose down -v
docker-compose up --build
```

2. **Wait for services** (30-60 seconds)

3. **Check health:**
```bash
curl http://localhost:8000/health/
```

4. **Test login:**
- Go to http://localhost:5173
- Login with existing user

5. **Check logs for errors:**
```bash
docker-compose logs backend | grep ERROR
```

---

## Success Indicators

✅ All containers running: `docker-compose ps`
✅ Health check passes: `curl http://localhost:8000/health/`
✅ Frontend loads: http://localhost:5173
✅ Backend API responds: http://localhost:8000/api/
✅ No errors in logs: `docker-compose logs`

---

## If All Else Fails

```bash
# Nuclear option - clean everything
docker-compose down -v
docker system prune -a --volumes
docker-compose up --build

# This will:
# - Stop all containers
# - Remove all volumes (data will be lost)
# - Remove all images
# - Rebuild from scratch
```

---

**Note:** Docker setup uses different ports to avoid conflicts with local development:
- MySQL: 3307 (Docker) vs 3306 (Local)
- Redis: 6380 (Docker) vs 6379 (Local)
- Backend: 8000 (same)
- Frontend: 5173 (same)
