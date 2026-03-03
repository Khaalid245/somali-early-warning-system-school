# Admin Dashboard Test Verification

## Quick Test Guide

### 1. Backend Test (5 minutes)

```bash
# Start backend server
cd school_support_backend
python manage.py runserver
```

**Test Endpoints:**
```bash
# Test admin dashboard endpoint (requires admin login)
curl -X GET http://127.0.0.1:8000/api/dashboard/admin/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response:
{
  "role": "admin",
  "total_students": <number>,
  "active_alerts": <number>,
  "active_alerts_change_percent": <number>,
  "active_alerts_trend": "up|down|stable",
  "open_cases": <number>,
  "open_cases_change_percent": <number>,
  "open_cases_trend": "up|down|stable",
  "monthly_alert_trend": [...],
  "monthly_case_trend": [...],
  "case_status_breakdown": [...]
}
```

**Check Audit Logs:**
```bash
# Check console output for:
# "Admin dashboard accessed by user <id> (<email>)"
```

---

### 2. Frontend Test (10 minutes)

```bash
# Start frontend server
cd school_support_frontend
npm run dev
```

**Test Checklist:**

#### Desktop (Chrome/Firefox)
- [ ] Navigate to http://localhost:5173/
- [ ] Login as admin
- [ ] Dashboard loads without console errors
- [ ] KPI cards display numbers
- [ ] Click "Refresh Data" button
- [ ] Button shows "Refreshing..." then "Refresh Data"
- [ ] Wait 5 minutes - dashboard auto-refreshes
- [ ] Check browser console for polling logs

#### Mobile (Chrome DevTools)
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select iPhone 12 Pro (390x844)
- [ ] Refresh page
- [ ] Layout stacks vertically ✓
- [ ] KPI cards show 2 columns on mobile ✓
- [ ] Text is readable (not too small) ✓
- [ ] Buttons are full-width on mobile ✓
- [ ] No horizontal scrolling ✓
- [ ] Sidebar collapses properly ✓

#### Tablet (iPad)
- [ ] Select iPad (768x1024)
- [ ] Layout shows 3 columns for KPIs ✓
- [ ] All content fits screen ✓

---

### 3. Rate Limiting Test (5 minutes)

**Test Rate Limiting:**
```bash
# Make 101 requests in 1 hour (should fail on 101st)
for i in {1..101}; do
  curl -X GET http://127.0.0.1:8000/api/dashboard/admin/ \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  echo "Request $i"
done

# Expected: First 100 succeed, 101st returns 429 Too Many Requests
```

---

### 4. Data Validation Test (3 minutes)

**Test Invalid Data Handling:**

1. Stop backend server
2. Open frontend
3. Try to load dashboard
4. Should show error message: "Failed to load dashboard"
5. Should show "Retry" button
6. Click "Retry" - should attempt to reload

**Test Null Data:**
```javascript
// In browser console:
// Simulate null response
fetch('/api/dashboard/admin/')
  .then(res => res.json())
  .then(data => console.log(data))

// Dashboard should handle null values gracefully
// KPI cards should show 0 instead of undefined
```

---

### 5. Component Rendering Test (5 minutes)

**Check All Components Load:**
- [ ] ExecutiveKPIs - 6 cards visible
- [ ] SystemHealth - Status card + 3 stat cards
- [ ] RiskIntelligence - Charts render
- [ ] EscalationPanel - Shows cases or "No escalated cases"
- [ ] PerformanceMetrics - Renders without errors
- [ ] ActivityFeed - Shows activities
- [ ] AttendanceDrillDown - Renders properly

**Check All Tabs:**
- [ ] Overview tab (default)
- [ ] Alerts tab
- [ ] Cases tab
- [ ] Students tab
- [ ] Audit tab
- [ ] Governance tab
- [ ] Reports tab
- [ ] Settings tab

---

### 6. Polling Test (5 minutes)

**Verify Auto-Refresh:**
1. Open browser console
2. Login to admin dashboard
3. Note current time
4. Wait 5 minutes
5. Check console for new API call to `/api/dashboard/admin/`
6. Verify data refreshes automatically

**Manual Test:**
```javascript
// In browser console:
// Check if polling interval is set
console.log('Polling active:', window.setInterval.length > 0);

// Monitor network tab for requests every 5 minutes
```

---

### 7. Responsive Breakpoints Test (10 minutes)

**Test All Breakpoints:**

| Width | Expected Layout | KPI Columns | Status |
|-------|----------------|-------------|--------|
| 320px | Mobile | 2 | [ ] |
| 375px | Mobile | 2 | [ ] |
| 425px | Mobile | 2 | [ ] |
| 768px | Tablet | 3 | [ ] |
| 1024px | Desktop | 6 | [ ] |
| 1440px | Desktop | 6 | [ ] |

**Test Elements:**
- [ ] Padding reduces on mobile (p-4 vs p-8)
- [ ] Text size reduces on mobile (text-2xl vs text-3xl)
- [ ] Buttons stack on mobile (flex-col vs flex-row)
- [ ] Grids adjust columns (grid-cols-2 vs grid-cols-6)

---

## Expected Results

### ✅ All Tests Pass
- Backend returns correct data structure
- Frontend handles data gracefully
- Mobile layout is responsive
- Polling works every 5 minutes
- Rate limiting enforces 100/hour
- Audit logs are created
- No console errors

### ❌ If Tests Fail

**Backend Issues:**
- Check Django server is running
- Check database migrations are applied
- Check user has admin role
- Check JWT token is valid

**Frontend Issues:**
- Check npm dependencies installed
- Check API client configuration
- Check browser console for errors
- Clear browser cache and retry

**Rate Limiting Issues:**
- Check Redis is running (if configured)
- Check throttle settings in settings.py
- Check user authentication

---

## Performance Benchmarks

### Load Time
- Initial load: < 2 seconds
- Refresh: < 1 second
- Polling: < 500ms

### Memory Usage
- Desktop: < 100MB
- Mobile: < 50MB

### Network
- Initial: < 500KB
- Polling: < 50KB per request

---

## Browser Compatibility

Tested on:
- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+

Mobile:
- [ ] iOS Safari
- [ ] Chrome Android
- [ ] Samsung Internet

---

## Accessibility Test (Optional)

- [ ] Screen reader compatible (ARIA labels)
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] No flashing content

---

## Security Test (Optional)

- [ ] CSRF token present
- [ ] JWT token in httpOnly cookie
- [ ] No sensitive data in console
- [ ] Rate limiting works
- [ ] Audit logs created
- [ ] XSS protection active

---

## Sign-Off

**Tested By:** _________________
**Date:** _________________
**Status:** ✅ PASS / ❌ FAIL
**Notes:** _________________

---

## Quick Commands

```bash
# Start everything
cd school_support_backend && python manage.py runserver &
cd school_support_frontend && npm run dev &

# Check logs
tail -f school_support_backend/logs/django.log

# Stop everything
pkill -f "python manage.py runserver"
pkill -f "npm run dev"
```
