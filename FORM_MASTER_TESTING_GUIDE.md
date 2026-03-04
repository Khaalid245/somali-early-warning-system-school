# Form Master Dashboard - Quick Testing Guide

## 🧪 Pre-Testing Setup

### 1. Start Backend Server
```bash
cd school_support_backend
python manage.py runserver
```

### 2. Start Frontend Server
```bash
cd school_support_frontend
npm run dev
```

### 3. Login as Form Master
- Navigate to `http://localhost:5173/login`
- Use form master credentials
- Should redirect to `/form-master`

---

## ✅ TEST SCENARIOS

### Test 1: Dashboard Loads Successfully
**Expected**: 
- 4 KPI cards display (Assigned Alerts, Open Cases, High Risk Students, Escalated Cases)
- High-risk students table shows data
- Classroom statistics cards display
- No console errors

**Pass Criteria**: ✅ All data loads within 2 seconds

---

### Test 2: Search Functionality
**Steps**:
1. Type student name in search box
2. Verify table filters in real-time
3. Clear search
4. Type student ID
5. Verify filtering works

**Pass Criteria**: ✅ Search filters correctly, no lag

---

### Test 3: Risk Level Filter
**Steps**:
1. Click "Filters" button
2. Select "High" from Risk Level dropdown
3. Verify only high-risk students show
4. Change to "Critical"
5. Verify filtering updates

**Pass Criteria**: ✅ Filter works, active filter count badge shows

---

### Test 4: Date Range Filter
**Steps**:
1. Click "This Month" preset
2. Verify dashboard data updates
3. Click "Last 7 Days"
4. Verify data changes
5. Select custom date range
6. Click "Clear"

**Pass Criteria**: ✅ Date filters work, data refreshes

---

### Test 5: Pagination
**Steps**:
1. If >10 students, verify pagination appears
2. Click "Next" button
3. Verify page 2 loads
4. Click page number directly
5. Click "Previous"

**Pass Criteria**: ✅ Pagination works smoothly, no data loss

---

### Test 6: Create Intervention Case
**Steps**:
1. Click "Create Case" button on any student
2. Verify modal opens with student info
3. Fill in description (required)
4. Select intervention type
5. Select priority
6. Set follow-up date (optional)
7. Click "Create Case"
8. Verify success toast
9. Verify modal closes
10. Verify dashboard refreshes

**Pass Criteria**: ✅ Case created successfully, appears in cases list

---

### Test 7: Student Detail Modal
**Steps**:
1. Click on student name in table
2. Verify modal opens
3. Check "Overview" tab shows student info
4. Click "Alerts" tab
5. Verify alerts display
6. Click "Cases" tab
7. Verify cases display
8. Click "Close"

**Pass Criteria**: ✅ All tabs work, data loads correctly

---

### Test 8: Case Detail Modal
**Steps**:
1. Navigate to "Cases" tab
2. Click "View Details" on any case
3. Verify modal opens with case info
4. Update status to "In Progress"
5. Add meeting notes
6. Set follow-up date
7. Click "Save Changes"
8. Verify success toast
9. Verify modal closes

**Pass Criteria**: ✅ Case updates successfully

---

### Test 9: Close Case with Resolution
**Steps**:
1. Open case detail modal
2. Change status to "Closed"
3. Verify resolution notes field appears (required)
4. Try to save without resolution notes
5. Verify error message
6. Add resolution notes
7. Click "Save Changes"
8. Verify success

**Pass Criteria**: ✅ Validation works, case closes properly

---

### Test 10: Escalate Case to Admin
**Steps**:
1. Open case detail modal
2. Click "Escalate to Admin" button
3. Confirm escalation
4. Verify success toast
5. Verify case status changes to "escalated_to_admin"
6. Reopen case
7. Verify warning message shows

**Pass Criteria**: ✅ Escalation works, warning displays

---

### Test 11: Alert Actions
**Steps**:
1. Navigate to "Alerts" tab
2. Find active alert
3. Click "Review" button
4. Verify status changes to "under_review"
5. Click "Resolve" button
6. Verify status changes to "resolved"

**Pass Criteria**: ✅ Alert status updates correctly

---

### Test 12: Manual Refresh
**Steps**:
1. Click "Refresh" button in header
2. Verify loading state shows briefly
3. Verify data refreshes
4. Check "Last updated" timestamp updates

**Pass Criteria**: ✅ Manual refresh works

---

### Test 13: Auto-Refresh (5 minutes)
**Steps**:
1. Note current "Last updated" time
2. Wait 5 minutes
3. Verify dashboard auto-refreshes
4. Verify timestamp updates

**Pass Criteria**: ✅ Auto-refresh works (optional - takes 5 min)

---

### Test 14: Tab Navigation
**Steps**:
1. Click "Alerts" in sidebar
2. Verify alerts tab shows
3. Click "Cases" in sidebar
4. Verify cases tab shows
5. Click "High Risk" in sidebar
6. Verify students tab shows
7. Click "Dashboard" in sidebar
8. Verify overview tab shows

**Pass Criteria**: ✅ All tabs navigate correctly

---

### Test 15: Mobile Responsiveness
**Steps**:
1. Open browser DevTools
2. Toggle device toolbar (mobile view)
3. Verify sidebar collapses
4. Verify tables scroll horizontally
5. Verify modals fit screen
6. Verify buttons are touch-friendly

**Pass Criteria**: ✅ Mobile view works acceptably

---

### Test 16: Security - RBAC
**Steps**:
1. Login as Form Master A
2. Note classroom ID
3. Logout
4. Login as Form Master B (different classroom)
5. Verify Form Master B cannot see Form Master A's students
6. Check API calls in Network tab
7. Verify `/students/` endpoint filters by classroom

**Pass Criteria**: ✅ Data isolation works, no cross-classroom access

---

### Test 17: Error Handling
**Steps**:
1. Stop backend server
2. Try to create case
3. Verify error toast shows
4. Try to refresh dashboard
5. Verify error message
6. Restart backend
7. Verify dashboard recovers

**Pass Criteria**: ✅ Graceful error handling, no crashes

---

### Test 18: Form Validation
**Steps**:
1. Open create case modal
2. Try to submit without description
3. Verify error message
4. Add description with 2001 characters
5. Verify character limit enforced
6. Open case detail modal
7. Try to close without resolution notes
8. Verify validation error

**Pass Criteria**: ✅ All validations work

---

### Test 19: Loading States
**Steps**:
1. Refresh page
2. Verify skeleton loaders show
3. Create case
4. Verify "Creating..." button text
5. Update case
6. Verify "Saving..." button text
7. Open student detail
8. Verify loading spinner

**Pass Criteria**: ✅ Loading states show appropriately

---

### Test 20: Empty States
**Steps**:
1. Search for non-existent student
2. Verify "No students match your filters" message
3. Clear search
4. Filter by risk level with no results
5. Verify empty state message
6. Navigate to alerts tab (if no alerts)
7. Verify "No recent alerts" message

**Pass Criteria**: ✅ Empty states are helpful and clear

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "Failed to load dashboard"
**Fix**: 
- Check backend is running on port 8000
- Verify database is accessible
- Check browser console for CORS errors

### Issue 2: "Failed to create case"
**Fix**:
- Verify student ID is valid
- Check backend logs for validation errors
- Ensure form master has permission

### Issue 3: Pagination not showing
**Fix**:
- Need >10 students to see pagination
- Check `filteredStudents.length` in console
- Verify `itemsPerPage` is set to 10

### Issue 4: Search not working
**Fix**:
- Check `searchTerm` state in React DevTools
- Verify `filteredStudents` updates
- Check for console errors

### Issue 5: Modals not opening
**Fix**:
- Check `showCreateCase`, `showStudentDetail`, `showCaseDetail` states
- Verify modal components are imported
- Check z-index conflicts

---

## 📊 PERFORMANCE BENCHMARKS

### Expected Performance:
- **Dashboard Load**: <2 seconds
- **Search Response**: <100ms (instant)
- **Filter Response**: <100ms (instant)
- **Modal Open**: <200ms
- **API Calls**: <500ms
- **Pagination**: <50ms (instant)

### If Performance is Slow:
1. Check network tab for slow API calls
2. Verify backend database queries are optimized
3. Check for unnecessary re-renders in React DevTools
4. Ensure pagination is working (not rendering all rows)

---

## ✅ FINAL CHECKLIST

Before marking as complete, verify:
- [ ] All 20 test scenarios pass
- [ ] No console errors
- [ ] No network errors (except intentional tests)
- [ ] Mobile view works
- [ ] Security (RBAC) works
- [ ] Performance is acceptable
- [ ] All modals open/close properly
- [ ] All forms validate correctly
- [ ] All buttons work
- [ ] All tabs navigate correctly

---

## 🎯 ACCEPTANCE CRITERIA

**PASS**: 18+ out of 20 tests pass
**FAIL**: <18 tests pass (needs fixes)

---

## 📝 TEST REPORT TEMPLATE

```
Date: ___________
Tester: ___________
Environment: Development / Production

Test Results:
- Test 1: ✅ / ❌
- Test 2: ✅ / ❌
- Test 3: ✅ / ❌
... (continue for all 20)

Total Passed: ___/20
Status: PASS / FAIL

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

---

**Good luck with testing! 🚀**
