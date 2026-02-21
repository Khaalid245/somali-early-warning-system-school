# 🚀 QUICK SETUP GUIDE - New Admin Features

## Step 1: Database Migration (REQUIRED)

The new AuditLog model needs to be added to the database.

```bash
cd somali-early-warning-system/school_support_backend
python manage.py makemigrations dashboard
python manage.py migrate
```

Expected output:
```
Migrations for 'dashboard':
  dashboard/migrations/0001_initial.py
    - Create model AuditLog
Running migrations:
  Applying dashboard.0001_initial... OK
```

---

## Step 2: Verify Backend Server

Start the backend server:

```bash
python manage.py runserver
```

Server should start at: `http://127.0.0.1:8000/`

---

## Step 3: Test New Endpoints

### Test Attendance Drill-Down:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:8000/dashboard/admin/attendance/drill-down/
```

### Test Audit Logs:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:8000/dashboard/admin/audit-logs/
```

### Test Case Reassignment:
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_form_master_id": 2, "reason": "Workload balancing"}' \
  http://127.0.0.1:8000/dashboard/admin/cases/1/reassign/
```

---

## Step 4: Start Frontend

```bash
cd ../school_support_frontend
npm run dev
```

Frontend should start at: `http://localhost:5173/`

---

## Step 5: Test New Features

### Login as Admin
1. Go to `http://localhost:5173/`
2. Login with admin credentials

### Test Each Tab:
1. **Dashboard** - Should show all components including new AttendanceDrillDown
2. **Alerts** - Student names should now display correctly
3. **Cases** - Test case review and close actions
4. **Students** - Should show students grouped by classroom
5. **Audit Logs** - NEW! Should show audit log viewer with filters
6. **Reports** - NEW! Should show 3 export options

### Test Exports:
1. Go to Reports tab
2. Click "Export Report" on each card
3. Verify CSV files download correctly

### Test Audit Logging:
1. Perform any action (close case, update alert, etc.)
2. Go to Audit Logs tab
3. Verify action appears in logs

---

## Step 6: Verify Student Names in Alerts

1. Go to Alerts tab
2. Verify student names display (not "Unknown")
3. Export alerts to CSV
4. Open CSV file
5. Verify student names are included

---

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution:** Make sure you're in the correct directory and virtual environment is activated
```bash
.venv\Scripts\activate  # Windows
python manage.py makemigrations
python manage.py migrate
```

### Issue: 403 Forbidden on new endpoints
**Solution:** Make sure you're logged in as admin
- Check user role in token
- Verify Authorization header is set

### Issue: Student names still show "Unknown"
**Solution:** Restart backend server after code changes
```bash
# Stop server (Ctrl+C)
python manage.py runserver
```

### Issue: Frontend components not loading
**Solution:** Clear browser cache and restart dev server
```bash
# Stop frontend (Ctrl+C)
npm run dev
```

### Issue: CSV export fails
**Solution:** Check backend logs for errors
- Verify endpoint is accessible
- Check browser console for errors
- Verify admin permissions

---

## ✅ Verification Checklist

- [ ] Database migration completed successfully
- [ ] Backend server running without errors
- [ ] Frontend server running without errors
- [ ] Can login as admin
- [ ] Dashboard tab loads all components
- [ ] Attendance drill-down shows classroom data
- [ ] Alerts tab shows student names correctly
- [ ] Audit Logs tab loads and filters work
- [ ] Reports tab shows 3 export cards
- [ ] Can export all 3 reports successfully
- [ ] CSV files contain correct data
- [ ] Audit logs capture actions correctly

---

## 📊 Expected Results

### Attendance Drill-Down:
- Table showing all classrooms
- Absence rate per classroom
- High-risk classrooms highlighted in red
- Color-coded by risk level

### Audit Logs:
- List of all system actions
- Filter by action type works
- Filter by date range works
- Pagination works (50 per page)
- Expandable metadata

### Reports:
- 3 export cards displayed
- Click export downloads CSV
- CSV files open in Excel/Sheets
- Data is complete and accurate

### Student Names:
- Display correctly in alerts table
- Display correctly in CSV exports
- Display correctly in case details

---

## 🎯 Quick Test Script

Run this to verify everything works:

1. **Backend Test:**
```bash
cd school_support_backend
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

2. **Frontend Test:**
```bash
cd school_support_frontend
npm run dev
```

3. **Browser Test:**
- Open `http://localhost:5173/`
- Login as admin
- Click through all 6 tabs
- Export all 3 reports
- Verify audit logs show actions

---

## 🚀 You're Ready!

If all checks pass, your admin dashboard is fully functional and ready for demo!

**Next Steps:**
1. Practice your demo
2. Prepare talking points
3. Review documentation
4. Test on different browsers
5. Submit with confidence!

---

**Status: READY FOR DEMO** ✨
