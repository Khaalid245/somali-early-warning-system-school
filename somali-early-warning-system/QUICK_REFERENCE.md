# 🚀 Quick Reference - Student Intervention Feature

## Essential Commands

### 1. Run Migration (if needed)
```bash
cd school_support_backend
python manage.py migrate interventions
```

### 2. Test the System
```bash
python test_interventions.py
```

### 3. Start Backend
```bash
python manage.py runserver
```

### 4. Start Frontend (new terminal)
```bash
cd ../school_support_frontend
npm run dev
```

### 5. Access the Feature
```
URL: http://localhost:5173/form-master/interventions
Login: yamka@gmail.com (Form Master)
```

---

## Quick Test Steps

1. **Login** as Form Master
2. **Navigate** to Interventions page
3. **Click** "Record New Meeting"
4. **Fill form:**
   - Select student
   - Enter meeting date
   - Write absence reason
   - Choose root cause
   - Add intervention notes
   - Define action plan
   - Set follow-up date
   - Select urgency
5. **Submit** and verify it appears in table
6. **Click** "Track Progress" on the meeting
7. **Add** progress update
8. **Change** status
9. **Submit** and verify update appears

---

## API Endpoints

```
GET    /api/interventions/meetings/           - List all meetings
POST   /api/interventions/meetings/           - Create meeting
GET    /api/interventions/meetings/{id}/      - Get meeting
PUT    /api/interventions/meetings/{id}/      - Update meeting
POST   /api/interventions/meetings/progress/  - Add progress
GET    /api/interventions/meetings/stats/     - Get statistics
```

---

## Common Issues & Fixes

### Issue: "No module named 'dotenv'"
```bash
pip install python-dotenv
```

### Issue: Migration warning about MySQL constraints
**Solution:** This is expected. The constraint is enforced at application level instead.

### Issue: Cannot access interventions page
**Solution:** 
- Verify you're logged in as Form Master
- Check URL: `/form-master/interventions`
- Clear browser cache

### Issue: Duplicate intervention error
**Solution:** This is correct behavior. Close existing intervention first.

---

## File Locations

### Backend
- Models: `interventions/models.py`
- Views: `interventions/meeting_views.py`
- Serializers: `interventions/serializers.py`
- URLs: `interventions/urls.py`

### Frontend
- Main Page: `formMaster/InterventionsPage.jsx`
- Dashboard: `formMaster/components/InterventionManagement.jsx`
- Record Modal: `formMaster/components/RecordMeetingModal.jsx`
- Progress Tracker: `formMaster/components/InterventionProgressTracker.jsx`

### Documentation
- Complete Guide: `COMPLETE_PACKAGE.md`
- Quick Start: `QUICK_START_GUIDE.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`
- Workflows: `WORKFLOW_DIAGRAM.md`

---

## Status Workflow

```
Open → Monitoring → Improving → Closed
         ↓
    Not Improving → Escalated
```

---

## Root Causes

- Health Issue
- Family Issue
- Academic Difficulty
- Financial Issue
- Behavioral Issue
- Other

---

## Urgency Levels

- 🟢 Low - Routine follow-up
- 🟡 Medium - Needs attention
- 🔴 High - Urgent action required

---

## Key Features

✅ Record detailed meetings
✅ Track progress over time
✅ Detect recurring absences
✅ Dashboard statistics
✅ Status management
✅ Duplicate prevention
✅ Permission control

---

## Support

- Technical Docs: `INTERVENTION_FEATURE_DOCUMENTATION.md`
- User Guide: `QUICK_START_GUIDE.md`
- Troubleshooting: `IMPLEMENTATION_SUMMARY.md`

---

**Version:** 1.0.0
**Status:** ✅ Ready to Use
