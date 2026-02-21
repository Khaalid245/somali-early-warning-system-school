# 🎯 ADMIN DASHBOARD - QUICK REFERENCE

## 🚀 Start Commands
```bash
# Backend
cd school_support_backend && python manage.py runserver

# Frontend  
cd school_support_frontend && npm run dev
```

## 🔑 Admin Login
- **URL**: http://localhost:5173/
- **Email**: admin@school.com
- **Password**: admin123

## 📊 Dashboard Sections

### Row 1: Executive KPIs (6 Cards)
| Metric | Description | Trend |
|--------|-------------|-------|
| Total Students | Active enrollment | - |
| Active Alerts | Requiring attention | ↑↓ |
| High Risk Alerts | Critical priority | - |
| Open Cases | In progress | ↑↓ |
| Escalated Cases | Admin action needed | - |
| Resolved This Month | Successfully closed | - |

### Row 2: System Health Score
- **Risk Index**: 0-100 (lower is better)
- **Status**: 🟢 Healthy / 🟡 Moderate / 🔴 Critical
- **Metrics**: High risk count, avg risk score, total students

### Row 3: Risk Intelligence
- **Alert Trend**: Line chart (6 months)
- **Risk Distribution**: Donut chart (Low/Med/High/Critical)

### Row 4: Case Trend
- **Bar Chart**: Created vs Closed vs Escalated (6 months)

### Row 5: Escalation Control Panel
- **Table**: Escalated cases with admin actions
- **Actions**: Review (add notes) | Close (resolve)
- **Highlight**: Overdue cases (>14 days)

### Row 6: Performance Metrics
- **Table**: Form master evaluation
- **Ratings**: ⭐⭐⭐ Excellent | ⭐⭐ Good | ⭐ Fair | ⚠️ Needs Improvement

### Row 7: Activity Feed
- **Recent**: Case created, escalated, closed (last 7 days)

## 🎨 Color Coding

### KPI Cards
- 🔵 Blue: Total Students
- 🟡 Yellow: Active Alerts
- 🔴 Red: High Risk Alerts
- 🟠 Orange: Open Cases
- 🟣 Purple: Escalated Cases
- 🟢 Green: Resolved

### Risk Levels
- 🟢 Low: Green
- 🟡 Medium: Yellow
- 🔴 High: Red
- 🟣 Critical: Purple

### Health Status
- 🟢 Healthy: 0-30
- 🟡 Moderate: 30-60
- 🔴 Critical: 60-100

## 🔧 Key Features

### ✅ Filtering (Alert Management)
- Search by student name/ID
- Filter by risk level
- Filter by status

### ✅ Export
- Click "Export CSV" button
- Downloads alerts data

### ✅ Admin Actions
1. Click "Review" or "Close" on escalated case
2. Add notes in modal
3. Click "Confirm"
4. Case updates automatically

### ✅ Navigation
- Dashboard (overview)
- Alerts (management)
- Cases (escalation panel)
- Reports (coming soon)

## 📱 Responsive Breakpoints
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667

## 🐛 Troubleshooting

### No data showing?
```bash
# Create test data in Django shell
python manage.py shell
```

### Charts not rendering?
- Check browser console
- Verify recharts installed: `npm list recharts`
- Clear cache and restart

### API errors?
- Verify admin user role
- Check Django logs
- Test endpoint: http://127.0.0.1:8000/dashboard/admin/

## 🎓 Demo Script (5 min)

**0:00-0:30** - Introduction
"Admin Dashboard - System Control Center"

**0:30-1:30** - Executive Overview
"6 KPIs with trend analysis showing school-wide metrics"

**1:30-2:30** - System Health & Risk Intelligence
"Risk Index provides single metric for overall health. Charts show 6-month trends."

**2:30-3:30** - Escalation Control
"Admins can review and close escalated cases directly. Overdue cases highlighted."

**3:30-4:30** - Performance Metrics
"Form masters evaluated on resolution time, on-time %, and escalations. Automated ratings."

**4:30-5:00** - Advanced Features
"Alert filtering, CSV export, activity tracking. Enterprise-grade tools."

## 📊 Sample Data Points

### Good System Health
- Risk Index: 25.0
- High Risk %: 5.0%
- Escalated Cases: 2
- On-time %: 85%

### Moderate System Health
- Risk Index: 45.0
- High Risk %: 12.0%
- Escalated Cases: 8
- On-time %: 65%

### Critical System Health
- Risk Index: 75.0
- High Risk %: 25.0%
- Escalated Cases: 15
- On-time %: 35%

## ✅ Pre-Demo Checklist
- [ ] Servers running
- [ ] Admin logged in
- [ ] Data populated
- [ ] Charts rendering
- [ ] No errors
- [ ] Actions working
- [ ] Export working
- [ ] Mobile responsive

## 🏆 Key Selling Points

1. **Single Risk Index** - One number for overall health
2. **Automated Ratings** - Staff performance evaluation
3. **6-Month Trends** - Historical analysis
4. **Direct Actions** - Admin can review/close cases
5. **Advanced Filtering** - Find specific alerts
6. **CSV Export** - Data portability
7. **Real-time Updates** - Live system monitoring
8. **Professional Design** - Enterprise-grade UI

---

**READY TO IMPRESS** 🎉
