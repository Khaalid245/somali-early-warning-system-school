# Attendance Calculation — How It Works

## Standard Used

UK DfE (Department for Education) day-based standard.
Attendance is counted in **school days**, not individual sessions.

---

## 1. Day Classification (`attendance_utils.py`)

Every school day is classified by looking at all session records for that date.

| Sessions on that day | Result |
|---|---|
| All sessions absent (or excused) | **1.0 absent day** |
| All sessions present | **1.0 present day** |
| All sessions late, none absent | **1.0 present day** + 1 late mark |
| Morning all absent, afternoon present | **0.5 absent day** |
| Morning present, afternoon all absent | **0.5 absent day** |
| Any other mixed pattern | **0.5 absent day** |

**Morning periods:** `morning`, `1`, `2`, `3`  
**Afternoon periods:** `afternoon`, `4`, `5`, `6`

---

## 2. Student Totals (`compute_attendance_days`)

For a student (or a filtered set of records), the system computes:

- `total_days` — distinct school days with any record
- `absent_days` — float (0.5 for half-days, 1.0 for full days)
- `present_days` — float
- `late_days` — integer count of days with at least one late session
- `attendance_rate` — `(present_days / total_days) × 100`
- `consecutive_absent_days` — most recent streak of **full** absent days (1.0 only)

---

## 3. Risk Score Calculation

Two engines use the same utility. Both produce a score from 0–100.

### Factor 1 — Attendance Rate (up to 40 pts)

| Attendance Rate | Points |
|---|---|
| Below 75% | +40 (critical) |
| Below 80% | +30 (high) |
| Below 90% | +15 (persistent absentee) |

### Factor 2 — Consecutive Full Absent Days (up to 40 pts)

| Streak | Points |
|---|---|
| 10+ days | +40 |
| 5–9 days | +30 |
| 3–4 days | +20 (first alert threshold) |
| 1–2 days | +5 |

### Factor 3 — Recent Absences (last 14 days, up to 20 pts)

| Absent days in last 2 weeks | Points |
|---|---|
| 5+ days | +20 |
| 3–4 days | +12 |
| 1–2 days | +5 |

### Factor 4 — Total Absent Days This Term (up to 10 pts)

| Total absent days | Points |
|---|---|
| 15+ days | +10 |
| 10–14 days | +7 (intervention threshold) |
| 3–9 days | +3 |

### Factor 5 — Consecutive Subject Absences (up to 15 pts, `risk/services.py` only)

| Same-subject streak | Points |
|---|---|
| 7+ sessions | +15 |
| 5–6 sessions | +10 |
| 3–4 sessions | +5 |

---

## 4. Risk Level Thresholds

| Score | Level |
|---|---|
| 75–100 | Critical |
| 50–74 | High |
| 25–49 | Medium / Moderate |
| 0–24 | Low |

---

## 5. Automatic Alerts & Interventions (`risk/services.py` + `signals.py`)

### Signal-triggered (on every attendance record save)

When all students in a session are marked, `update_risk_after_session` runs and:

- Recalculates the student's risk score
- Creates or updates an **Alert** record if level is medium/high/critical
- Creates an **InterventionCase** if level is high or critical
- Auto-resolves the alert if level drops back to low

### Consecutive absence check (on every absent record save)

`check_consecutive_absences` runs independently and:

- Counts the most recent streak of **full absent days**
- If streak ≥ 3 days → creates an Alert (level: `high`) assigned to the form master
- If streak ≥ 5 days → Alert level becomes `critical`
- Skips creation if an active/under_review alert already exists for that student

---

## 6. Where Each Calculation Is Used

| Location | What it calculates |
|---|---|
| `attendance_utils.py` | Shared utility — day classification + totals |
| `interventions/ai_recommendations.py` | Dashboard display, bulk classroom analysis, AI recommendations |
| `risk/services.py` | Signal-triggered DB updates to `StudentRiskProfile` and `SubjectRiskInsight` |
| `attendance/signals.py` | Consecutive absence detection → Alert creation |
| `dashboard/services.py` | Form master dashboard stats, high-risk student list |
| `attendance/student_report_view.py` | Per-student attendance report API |
| `dashboard/admin_actions.py` | Admin attendance drill-down per classroom |
