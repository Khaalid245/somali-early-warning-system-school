# 🚀 Deployment Checklist - Student Intervention Feature

## Pre-Deployment Steps

### ✅ Step 1: Run Database Migration
```bash
cd school_support_backend
python manage.py migrate interventions
```

**Expected Output:**
```
Running migrations:
  Applying interventions.0009_remove_interventioncase_case_assigned_idx_and_more... OK
```

**Verification:**
```bash
python manage.py dbshell
```
```sql
SHOW TABLES LIKE 'interventions_%';
-- Should show: interventions_interventionmeeting, interventions_progressupdate
```

---

### ✅ Step 2: Verify Backend Server
```bash
python manage.py runserver
```

**Test Endpoints:**
- http://127.0.0.1:8000/api/interventions/meetings/
- http://127.0.0.1:8000/api/interventions/meetings/stats/

**Expected:** Should return JSON (may be empty initially)

---

### ✅ Step 3: Start Frontend Server
```bash
cd ../school_support_frontend
npm run dev
```

**Access:** http://localhost:5173

---

### ✅ Step 4: Login as Form Master
- **URL:** http://localhost:5173/login
- **User:** yamka@gmail.com (or your Form Master account)
- **Password:** [your password]

---

### ✅ Step 5: Navigate to Interventions
- **URL:** http://localhost:5173/form-master/interventions
- **Expected:** Should see the intervention dashboard with statistics

---

## Testing Checklist

### 🧪 Basic Functionality Tests

#### Test 1: View Dashboard
- [ ] Statistics cards display (Total, Active, High Urgency, Overdue)
- [ ] Filters are visible (Status, Urgency)
- [ ] "Record New Meeting" button is visible
- [ ] Table displays (may be empty initially)

#### Test 2: Record Meeting
- [ ] Click "Record New Meeting"
- [ ] Modal opens
- [ ] Select a student from dropdown
- [ ] Fill in all required fields:
  - [ ] Meeting date
  - [ ] Absence reason
  - [ ] Root cause
  - [ ] Intervention notes
  - [ ] Action plan
  - [ ] Follow-up date (optional)
  - [ ] Urgency level
- [ ] Click "Record Meeting"
- [ ] Success message appears
- [ ] Meeting appears in table

#### Test 3: Track Progress
- [ ] Find the meeting in the table
- [ ] Click "Track Progress →"
- [ ] Modal opens with meeting summary
- [ ] Change status (e.g., Open → Monitoring)
- [ ] Add progress notes
- [ ] Click "Add Progress Update"
- [ ] Success message appears
- [ ] Progress count increases in table

#### Test 4: Filters
- [ ] Filter by status (e.g., "Open")
- [ ] Table updates to show only open cases
- [ ] Filter by urgency (e.g., "High")
- [ ] Table updates to show only high urgency cases
- [ ] Clear filters
- [ ] All meetings display again

#### Test 5: Recurring Absences
- [ ] Create 2+ meetings for the same student
- [ ] Yellow warning banner appears
- [ ] Student listed in recurring absences

---

### 🔒 Security Tests

#### Test 6: Permissions
- [ ] Login as Teacher (not Form Master)
- [ ] Try to access /form-master/interventions
- [ ] Should be redirected or see "Access Denied"
- [ ] Logout and login as Form Master
- [ ] Can access interventions page

#### Test 7: Data Isolation
- [ ] Create meeting as Form Master A
- [ ] Logout and login as Form Master B
- [ ] Form Master B should NOT see Form Master A's meetings
- [ ] Login as Admin
- [ ] Admin should see ALL meetings

---

### 🐛 Error Handling Tests

#### Test 8: Validation
- [ ] Try to submit meeting without required fields
- [ ] Should see validation errors
- [ ] Try to set follow-up date in the past
- [ ] Should see error message

#### Test 9: Duplicate Prevention
- [ ] Create meeting for Student X with root cause "Health"
- [ ] Try to create another meeting for Student X with "Health" (without closing first)
- [ ] Should see error about duplicate active intervention

#### Test 10: Status Transitions
- [ ] Create meeting with status "Open"
- [ ] Change to "Closed"
- [ ] Try to change back to "Open"
- [ ] Should see error (cannot reopen closed cases)

---

## Post-Deployment Verification

### ✅ Database Check
```bash
python manage.py shell
```
```python
from interventions.models import InterventionMeeting, ProgressUpdate

# Check meetings created
print(f"Total meetings: {InterventionMeeting.objects.count()}")

# Check progress updates
print(f"Total updates: {ProgressUpdate.objects.count()}")

# View latest meeting
latest = InterventionMeeting.objects.first()
if latest:
    print(f"Latest: {latest.student.full_name} - {latest.root_cause}")
```

### ✅ Admin Panel Check
- Navigate to: http://127.0.0.1:8000/admin/
- Login as admin
- Check "Interventions" section
- Should see:
  - Intervention meetings
  - Progress updates
- Click on each to verify data

---

## Performance Verification

### ✅ Load Time Check
- [ ] Dashboard loads in < 2 seconds
- [ ] Filters respond instantly
- [ ] Modals open smoothly
- [ ] Form submission completes in < 1 second

### ✅ Data Integrity Check
- [ ] All timestamps are correct
- [ ] Author names display correctly
- [ ] Student names display correctly
- [ ] Status badges show correct colors
- [ ] Urgency badges show correct colors

---

## Documentation Verification

### ✅ Files Present
- [ ] INTERVENTION_FEATURE_DOCUMENTATION.md
- [ ] IMPLEMENTATION_SUMMARY.md
- [ ] QUICK_START_GUIDE.md
- [ ] WORKFLOW_DIAGRAM.md
- [ ] COMPLETE_PACKAGE.md
- [ ] THIS FILE (DEPLOYMENT_CHECKLIST.md)

### ✅ Code Files Present
Backend:
- [ ] interventions/models.py (updated)
- [ ] interventions/serializers.py (updated)
- [ ] interventions/meeting_views.py (new)
- [ ] interventions/urls.py (updated)
- [ ] interventions/admin.py (updated)
- [ ] interventions/migrations/0008_*.py (new)

Frontend:
- [ ] api/interventionApi.js (new)
- [ ] formMaster/components/RecordMeetingModal.jsx (new)
- [ ] formMaster/components/InterventionProgressTracker.jsx (new)
- [ ] formMaster/components/InterventionManagement.jsx (new)
- [ ] formMaster/components/InterventionQuickAccess.jsx (new)
- [ ] formMaster/InterventionsPage.jsx (new)
- [ ] App.jsx (updated)

---

## Common Issues & Solutions

### Issue 1: Migration Fails
**Error:** `No module named 'dotenv'`
**Solution:** 
```bash
pip install python-dotenv
```

### Issue 2: Cannot Access Interventions Page
**Error:** 404 Not Found
**Solution:** 
- Verify route in App.jsx
- Check that you're logged in as Form Master
- Clear browser cache

### Issue 3: API Returns 403 Forbidden
**Error:** Permission denied
**Solution:**
- Verify JWT token is valid
- Check user role is 'form_master'
- Logout and login again

### Issue 4: Duplicate Constraint Error
**Error:** Unique constraint violation
**Solution:**
- This is expected behavior
- Close existing intervention before creating new one
- Or choose different root cause

### Issue 5: Frontend Not Loading Data
**Error:** Empty table, no statistics
**Solution:**
- Check backend is running
- Check API endpoints in browser Network tab
- Verify CORS settings
- Check for JavaScript errors in console

---

## Production Deployment Steps

### 1. Environment Variables
```bash
# Add to .env file
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

### 2. Static Files
```bash
cd school_support_frontend
npm run build
```

### 3. Database Backup
```bash
mysqldump -u root -p school_support_db > backup_before_intervention.sql
```

### 4. Run Migration on Production
```bash
python manage.py migrate interventions --settings=school_support_backend.settings_production
```

### 5. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### 6. Restart Services
```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

---

## Rollback Plan (If Needed)

### If Something Goes Wrong:

1. **Restore Database:**
```bash
mysql -u root -p school_support_db < backup_before_intervention.sql
```

2. **Revert Migration:**
```bash
python manage.py migrate interventions 0007_add_indexes
```

3. **Remove Frontend Changes:**
```bash
git checkout App.jsx
git checkout formMaster/
```

---

## Success Criteria

### ✅ Feature is Successfully Deployed When:
- [ ] All migrations run without errors
- [ ] Dashboard loads and displays statistics
- [ ] Can create intervention meetings
- [ ] Can add progress updates
- [ ] Filters work correctly
- [ ] Recurring absences detected
- [ ] Permissions enforced correctly
- [ ] No console errors
- [ ] No API errors
- [ ] Documentation is accessible

---

## Sign-Off

### Tested By: ___________________
### Date: ___________________
### Status: [ ] PASS  [ ] FAIL
### Notes: ___________________

---

## Next Steps After Deployment

1. **Train Form Masters**
   - Schedule training session
   - Distribute Quick Start Guide
   - Provide hands-on practice

2. **Monitor Usage**
   - Check logs for errors
   - Monitor performance
   - Gather user feedback

3. **Iterate**
   - Address user feedback
   - Fix any bugs
   - Plan enhancements

---

## Support Contacts

- **Technical Issues:** IT Department
- **Feature Questions:** Development Team
- **Training:** Form Master Coordinator
- **Emergency:** System Administrator

---

**🎉 Congratulations! You're ready to deploy the Student Intervention & Progress Tracking feature!**

---

## Quick Command Summary

```bash
# Backend
cd school_support_backend
python manage.py migrate interventions
python manage.py runserver

# Frontend
cd school_support_frontend
npm run dev

# Access
http://localhost:5173/form-master/interventions

# Test User
Email: yamka@gmail.com
Role: Form Master
```

---

**Last Updated:** February 21, 2025
**Version:** 1.0.0
**Status:** ✅ Ready for Deployment
