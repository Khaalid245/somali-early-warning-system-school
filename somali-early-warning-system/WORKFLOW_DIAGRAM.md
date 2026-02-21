# Student Intervention Workflow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FORM MASTER DASHBOARD                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Statistics  │  │   Warnings   │  │   Filters    │         │
│  │   - Total    │  │  - Recurring │  │  - Status    │         │
│  │   - Active   │  │  - Overdue   │  │  - Urgency   │         │
│  │   - Urgent   │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           INTERVENTION MEETINGS TABLE                   │    │
│  │  Student | Date | Cause | Status | Urgency | Actions   │    │
│  │  ─────────────────────────────────────────────────────  │    │
│  │  Ahmed   | 2/20 | Health| Open   | Medium  | Track →   │    │
│  │  Fatima  | 2/18 | Family| Monitor| High    | Track →   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [+ Record New Meeting]                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Intervention Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERVENTION LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────┘

1. DETECTION
   ↓
   Student Absence Detected
   ↓
   Form Master Notified
   
2. MEETING
   ↓
   ┌──────────────────────────────┐
   │  Form Master Meets Student   │
   │  - Discuss absence           │
   │  - Understand root cause     │
   │  - Build rapport             │
   └──────────────────────────────┘
   
3. DOCUMENTATION
   ↓
   ┌──────────────────────────────┐
   │   Record Meeting in System   │
   │   ✓ Absence reason           │
   │   ✓ Root cause category      │
   │   ✓ Intervention notes       │
   │   ✓ Action plan              │
   │   ✓ Follow-up date           │
   │   ✓ Urgency level            │
   └──────────────────────────────┘
   
4. MONITORING
   ↓
   ┌──────────────────────────────┐
   │    Track Progress Over Time  │
   │    - Add updates             │
   │    - Change status           │
   │    - Observe patterns        │
   └──────────────────────────────┘
   
5. DECISION
   ↓
   ┌─────────────┬─────────────┬─────────────┐
   │  Improving  │ Not Better  │  Resolved   │
   ├─────────────┼─────────────┼─────────────┤
   │  Continue   │  Escalate   │   Close     │
   │  Monitoring │  to Admin   │   Case      │
   └─────────────┴─────────────┴─────────────┘
```

## Status Flow Diagram

```
                    ┌──────────┐
                    │   OPEN   │ ← Initial Status
                    └────┬─────┘
                         │
                         ↓
                  ┌──────────────┐
                  │  MONITORING  │ ← Actively watching
                  └──┬────────┬──┘
                     │        │
         ┌───────────┘        └───────────┐
         ↓                                 ↓
    ┌──────────┐                    ┌──────────────┐
    │IMPROVING │                    │NOT IMPROVING │
    └────┬─────┘                    └──────┬───────┘
         │                                  │
         │                                  ↓
         │                           ┌──────────────┐
         │                           │  ESCALATED   │
         │                           └──────────────┘
         │
         ↓
    ┌──────────┐
    │  CLOSED  │ ← Final Status
    └──────────┘

Rules:
• Cannot reopen CLOSED cases
• Cannot escalate CLOSED cases
• ESCALATED goes to administration
• IMPROVING requires sustained progress
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  InterventionsPage.jsx                                          │
│         │                                                        │
│         ├─→ InterventionManagement.jsx (Main Dashboard)         │
│         │        │                                               │
│         │        ├─→ RecordMeetingModal.jsx                     │
│         │        │        │                                      │
│         │        │        └─→ [Create Meeting]                  │
│         │        │                                               │
│         │        └─→ InterventionProgressTracker.jsx            │
│         │                 │                                      │
│         │                 └─→ [Add Progress Update]             │
│         │                                                        │
│         └─→ InterventionQuickAccess.jsx (Widget)                │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      BACKEND (Django)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  interventionApi.js                                             │
│         │                                                        │
│         ├─→ POST /api/interventions/meetings/                   │
│         ├─→ GET  /api/interventions/meetings/                   │
│         ├─→ PUT  /api/interventions/meetings/{id}/              │
│         ├─→ POST /api/interventions/meetings/progress/          │
│         ├─→ GET  /api/interventions/meetings/stats/             │
│         └─→ GET  /api/interventions/meetings/recurring/         │
│                                                                  │
│  meeting_views.py                                               │
│         │                                                        │
│         ├─→ InterventionMeetingListCreateView                   │
│         ├─→ InterventionMeetingDetailView                       │
│         ├─→ ProgressUpdateCreateView                            │
│         ├─→ StudentInterventionHistoryView                      │
│         ├─→ RecurringAbsenceDetectionView                       │
│         └─→ InterventionDashboardStatsView                      │
│                                                                  │
│  serializers.py                                                 │
│         │                                                        │
│         ├─→ InterventionMeetingSerializer                       │
│         │        │                                               │
│         │        └─→ [Validation Rules]                         │
│         │                                                        │
│         └─→ ProgressUpdateSerializer                            │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ ORM
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                      DATABASE (MySQL)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  interventions_interventionmeeting                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ id, student_id, meeting_date, absence_reason,        │      │
│  │ root_cause, intervention_notes, action_plan,         │      │
│  │ follow_up_date, urgency_level, status,               │      │
│  │ created_by_id, created_at, updated_at                │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  interventions_progressupdate                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ id, meeting_id, update_text,                         │      │
│  │ created_by_id, created_at                            │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  CONSTRAINTS:                                                   │
│  • UNIQUE (student_id, root_cause) WHERE status = active       │
│  • FOREIGN KEY student_id → students_student                   │
│  • FOREIGN KEY created_by_id → users_user                      │
│                                                                  │
│  INDEXES:                                                       │
│  • (student_id, status)                                        │
│  • (status)                                                    │
│  • (urgency_level)                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

SCENARIO: Student with Recurring Absences

Step 1: Form Master Logs In
   │
   ├─→ Dashboard loads
   ├─→ Statistics displayed
   └─→ Warning: "3 students with recurring absences"

Step 2: Navigate to Interventions
   │
   ├─→ Click "Manage Interventions"
   ├─→ View full list of meetings
   └─→ See filters and search

Step 3: Record New Meeting
   │
   ├─→ Click "+ Record New Meeting"
   ├─→ Modal opens
   │
   ├─→ Select Student: "Ahmed Hassan"
   ├─→ Meeting Date: "2025-02-21"
   ├─→ Absence Reason: "Student was absent for 4 days"
   ├─→ Root Cause: "Family Issue"
   ├─→ Notes: "Family emergency - grandmother hospitalized..."
   ├─→ Action Plan: "Monitor attendance, check in weekly..."
   ├─→ Follow-up: "2025-02-28"
   ├─→ Urgency: "High"
   │
   └─→ Click "Record Meeting"
        │
        └─→ Success! Meeting saved

Step 4: Track Progress (1 Week Later)
   │
   ├─→ Find Ahmed's meeting in table
   ├─→ Click "Track Progress →"
   ├─→ Modal opens with meeting summary
   │
   ├─→ Change Status: "Open" → "Monitoring"
   ├─→ Add Note: "Spoke with Ahmed. Grandmother recovering..."
   │
   └─→ Click "Add Progress Update"
        │
        └─→ Success! Progress recorded

Step 5: Continue Monitoring (2 Weeks Later)
   │
   ├─→ Click "Track Progress →" again
   ├─→ Review previous updates
   │
   ├─→ Change Status: "Monitoring" → "Improving"
   ├─→ Add Note: "Perfect attendance this week..."
   │
   └─→ Click "Add Progress Update"

Step 6: Close Case (1 Month Later)
   │
   ├─→ Click "Track Progress →"
   ├─→ Review complete history
   │
   ├─→ Change Status: "Improving" → "Closed"
   ├─→ Add Note: "Sustained improvement. Case resolved..."
   │
   └─→ Click "Add Progress Update"
        │
        └─→ Case closed successfully!

ALTERNATIVE PATH: Escalation Needed

Step 4b: No Improvement
   │
   ├─→ Track Progress shows "Not Improving"
   ├─→ Warning: "Multiple updates without improvement"
   │
   ├─→ Change Status: "Not Improving" → "Escalated"
   ├─→ Add Note: "No progress after 3 weeks. Escalating..."
   │
   └─→ Administration notified
```

## Permission Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                      PERMISSION MATRIX                           │
├──────────────────┬──────────────┬──────────────┬───────────────┤
│     ACTION       │ FORM MASTER  │    ADMIN     │    TEACHER    │
├──────────────────┼──────────────┼──────────────┼───────────────┤
│ Create Meeting   │      ✓       │      ✓       │       ✗       │
│ View Own         │      ✓       │      ✓       │       ✗       │
│ View All         │      ✗       │      ✓       │       ✗       │
│ Update Own       │      ✓       │      ✓       │       ✗       │
│ Update Any       │      ✗       │      ✓       │       ✗       │
│ Delete Own       │      ✓       │      ✓       │       ✗       │
│ Delete Any       │      ✗       │      ✓       │       ✗       │
│ Add Progress     │      ✓       │      ✓       │       ✗       │
│ View Stats       │   Own Only   │     All      │       ✗       │
│ View Recurring   │   Own Only   │     All      │       ✗       │
└──────────────────┴──────────────┴──────────────┴───────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATION                            │
└─────────────────────────────────────────────────────────────────┘

Intervention System
       │
       ├─→ Students Module
       │   └─→ Links to student records
       │
       ├─→ Attendance Module
       │   └─→ Triggers based on absence patterns
       │
       ├─→ Alerts Module
       │   └─→ Can create intervention from alert
       │
       ├─→ Users Module
       │   └─→ Form Master authentication
       │
       └─→ Risk Module
           └─→ Updates risk scores based on interventions
```

---

**Legend:**
- `→` : Data flow / Navigation
- `├─→` : Branch / Option
- `└─→` : Final step / Result
- `✓` : Allowed
- `✗` : Not allowed
- `↓` : Sequential flow
