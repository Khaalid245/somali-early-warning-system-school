# Docker Quick Test Guide

## 1. Check Containers
```bash
docker ps
```

## 2. Start Docker
```bash
cd somali-early-warning-system
docker-compose up -d
```

## 3. Stop Docker
```bash
docker-compose down
```

## 4. Rebuild After Changes
```bash
docker-compose up -d --build
```

## 5. Test Backend Health
```bash
curl http://localhost:8000/health/
```
**Expected**: `{"status":"healthy","database":"ok","cache":"ok"}`

## 6. Test Database
```bash
docker exec school_support_db mysql -udjango_user -pSchoolSupport123 -e "SELECT 1;"
```

## 7. Test Redis
```bash
docker exec school_support_redis redis-cli ping
```
**Expected**: `PONG`

## 8. View Logs
```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 50 lines
docker logs school_support_backend --tail 50
```

## 9. Restart Containers
```bash
docker-compose restart
```

## 10. Fix Port Conflict (3307)
```bash
docker stop alif-db
docker-compose up -d
```

## URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs/
- **Admin**: http://localhost:8000/admin/

## Ports
- MySQL: 3307
- Redis: 6380
- Backend: 8000
- Frontend: 5173

## Quick Status Check
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
