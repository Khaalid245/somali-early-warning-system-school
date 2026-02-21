# 🚀 ADMIN DASHBOARD - START HERE

## Step 1: Start Backend

```bash
cd school_support_backend
python manage.py runserver
```

**Expected output:**
```
Starting development server at http://127.0.0.1:8000/
```

## Step 2: Start Frontend

```bash
cd school_support_frontend
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

## Step 3: Create Admin User (if needed)

```bash
cd school_support_backend
python manage.py shell
```

```python
from users.models import User

# Create admin
admin = User.objects.create_user(
    email='admin@school.com',
    password='admin123',
    name='System Administrator',
    role='admin',
    is_staff=True,
    is_superuser=True
)
print(f"✅ Admin created: {admin.email}")
exit()
```

## Step 4: Login

1. Open browser: http://localhost:5173/
2. Email: `admin@school.com`
3. Password: `admin123`
4. Click Login

## Step 5: Verify Dashboard

You should see:
- ✅ 6 KPI cards at top
- ✅ System Health Score
- ✅ Charts (Line, Bar, Donut)
- ✅ Escalation table
- ✅ Performance metrics
- ✅ Activity feed

## 🐛 Troubleshooting

### White Screen?
1. Open browser console (F12)
2. Check for errors
3. Verify backend is running
4. Check network tab for API calls

### API Error?
```bash
# Test endpoint directly
curl http://127.0.0.1:8000/api/dashboard/admin/
```

### No Data?
Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

## ✅ Success Checklist
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Admin user created
- [ ] Can login
- [ ] Dashboard loads
- [ ] No console errors
