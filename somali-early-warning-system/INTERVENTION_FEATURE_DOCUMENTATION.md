# Student Intervention and Progress Tracking Feature

## Overview

The Student Intervention and Progress Tracking feature enables Form Masters to systematically document meetings with students who have attendance issues, identify root causes, implement action plans, and track progress over time.

---

## Features

### 1. Intervention Meeting Recording

Form Masters can record detailed meeting entries including:

- **Student Selection**: Choose from enrolled students
- **Meeting Date**: Date when the meeting occurred
- **Absence Reason**: Free-text documentation of what the student said
- **Root Cause Category**: Categorized classification
  - Health Issue
  - Family Issue
  - Academic Difficulty
  - Financial Issue
  - Behavioral Issue
  - Other
- **Intervention Notes**: Detailed observations and discussion points
- **Action Plan**: Specific follow-up strategy and next steps
- **Follow-up Date**: Scheduled date for next check-in
- **Urgency Level**: Low, Medium, or High

### 2. Progress Tracking

- **Chronological Updates**: Add timestamped progress notes
- **Status Management**: Track intervention status
  - Open
  - Monitoring
  - Improving
  - Not Improving
  - Escalated
  - Closed
- **Author Attribution**: All updates include creator name and timestamp
- **Complete History**: View all interventions and updates for a student

### 3. Dashboard & Analytics

- **Statistics Overview**:
  - Total meetings recorded
  - Active cases count
  - High urgency cases
  - Overdue follow-ups
- **Recurring Absence Detection**: Automatic identification of students with multiple interventions
- **Warning Indicators**: Visual alerts for repeated issues without improvement

### 4. Data Integrity

- **Unique Constraint**: Prevents duplicate active interventions for the same root cause
- **Status Validation**: Enforces logical status transitions
- **Future Date Validation**: Follow-up dates must be in the future
- **Required Fields**: Student must be specified for all interventions
- **Audit Trail**: All updates are permanently recorded

---

## API Endpoints

### Intervention Meetings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interventions/meetings/` | List all meetings (with filters) |
| POST | `/api/interventions/meetings/` | Create new meeting |
| GET | `/api/interventions/meetings/{id}/` | Get meeting details |
| PUT | `/api/interventions/meetings/{id}/` | Update meeting |
| DELETE | `/api/interventions/meetings/{id}/` | Delete meeting |

### Progress Updates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interventions/meetings/progress/` | Add progress update |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interventions/meetings/student/{id}/` | Get student intervention history |
| GET | `/api/interventions/meetings/recurring/` | Detect recurring absences |
| GET | `/api/interventions/meetings/stats/` | Get dashboard statistics |

### Query Parameters

**List Meetings** (`GET /api/interventions/meetings/`)
- `status`: Filter by status (open, monitoring, improving, etc.)
- `urgency`: Filter by urgency level (low, medium, high)
- `student`: Filter by student ID

---

## Database Schema

### InterventionMeeting Model

```python
{
  "id": Integer (Primary Key),
  "student": ForeignKey(Student),
  "meeting_date": Date,
  "absence_reason": Text,
  "root_cause": Choice(health, family, academic, financial, behavioral, other),
  "intervention_notes": Text,
  "action_plan": Text,
  "follow_up_date": Date (nullable),
  "urgency_level": Choice(low, medium, high),
  "status": Choice(open, monitoring, improving, not_improving, escalated, closed),
  "created_by": ForeignKey(User),
  "created_at": DateTime,
  "updated_at": DateTime
}
```

### ProgressUpdate Model

```python
{
  "id": Integer (Primary Key),
  "meeting": ForeignKey(InterventionMeeting),
  "update_text": Text,
  "created_by": ForeignKey(User),
  "created_at": DateTime
}
```

### Constraints

- **Unique Constraint**: One active intervention per student per root cause
- **Indexes**: Optimized queries on student+status, status, and urgency_level

---

## Frontend Components

### 1. InterventionManagement.jsx
Main dashboard component displaying:
- Statistics cards
- Recurring absence warnings
- Filters (status, urgency)
- Meetings table
- Action buttons

### 2. RecordMeetingModal.jsx
Modal form for recording new intervention meetings with:
- Student selection
- All required fields
- Validation
- Error handling

### 3. InterventionProgressTracker.jsx
Progress tracking interface with:
- Meeting summary
- Status update selector
- Progress note input
- Chronological history display
- Warning indicators

### 4. InterventionQuickAccess.jsx
Dashboard widget showing:
- Active cases count
- High priority alerts
- Quick navigation

---

## Usage Guide

### Recording a Meeting

1. Navigate to **Form Master Dashboard** → **Interventions**
2. Click **"+ Record New Meeting"**
3. Select the student (if not pre-selected)
4. Fill in all required fields:
   - Meeting date
   - Absence reason
   - Root cause category
   - Intervention notes
   - Action plan
   - Follow-up date (optional)
   - Urgency level
5. Click **"Record Meeting"**

### Tracking Progress

1. From the interventions table, click **"Track Progress →"** on any meeting
2. Review the meeting summary and current status
3. Select new status if changed
4. Enter progress notes
5. Click **"Add Progress Update"**
6. View chronological history below

### Monitoring Recurring Issues

- The system automatically detects students with 2+ interventions
- A warning banner displays at the top of the dashboard
- Click on student names to view full history
- Consider escalation for students with multiple interventions without improvement

---

## Permissions

### Form Master
- Create intervention meetings
- View own meetings only
- Update own meetings
- Add progress updates to own meetings
- Delete own meetings

### Admin
- View all meetings
- Update any meeting
- Delete any meeting
- Access all analytics

---

## Validation Rules

### Meeting Creation
- Student is required
- Meeting date cannot be in the future
- All text fields must be non-empty
- Follow-up date must be in the future (if provided)

### Status Transitions
- Cannot reopen closed interventions
- Cannot escalate closed interventions
- Closing requires resolution notes (enforced at serializer level)

### Duplicate Prevention
- Only one active intervention per student per root cause
- Active statuses: open, monitoring, improving, not_improving, escalated

---

## Best Practices

1. **Document Thoroughly**: Include specific details in intervention notes
2. **Set Follow-ups**: Always set a follow-up date for accountability
3. **Update Regularly**: Add progress notes after each interaction
4. **Use Correct Status**: Keep status current to reflect actual progress
5. **Escalate When Needed**: Don't hesitate to escalate cases not improving
6. **Review Recurring Cases**: Pay special attention to students with multiple interventions

---

## Migration Instructions

### Backend

1. Run the migration:
```bash
cd school_support_backend
python manage.py migrate interventions
```

2. Verify models are created:
```bash
python manage.py shell
>>> from interventions.models import InterventionMeeting, ProgressUpdate
>>> InterventionMeeting.objects.count()
```

### Frontend

1. Install dependencies (if any new ones added):
```bash
cd school_support_frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Navigate to: `http://localhost:5173/form-master/interventions`

---

## Testing Checklist

- [ ] Create intervention meeting
- [ ] View meetings list
- [ ] Filter by status
- [ ] Filter by urgency
- [ ] Add progress update
- [ ] Update meeting status
- [ ] View student history
- [ ] Check recurring absence detection
- [ ] Verify duplicate prevention
- [ ] Test status transition validation
- [ ] Confirm follow-up date validation
- [ ] Test overdue follow-up indicator
- [ ] Verify permission restrictions

---

## Future Enhancements

1. **Email Notifications**: Automatic reminders for overdue follow-ups
2. **Parent Communication**: Log parent meeting notes
3. **Document Attachments**: Upload supporting documents
4. **Intervention Templates**: Pre-defined action plans for common issues
5. **Analytics Dashboard**: Trends and success rate metrics
6. **Export Reports**: Generate intervention reports for administration
7. **Mobile App**: Record meetings on mobile devices

---

## Support

For issues or questions:
- Check the API documentation
- Review validation error messages
- Consult the development team
- Submit bug reports with detailed steps to reproduce

---

## Version History

- **v1.0.0** (2025-02-21): Initial release
  - Meeting recording
  - Progress tracking
  - Dashboard analytics
  - Recurring absence detection
