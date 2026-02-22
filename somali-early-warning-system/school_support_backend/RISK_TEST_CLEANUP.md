# Risk Test File Cleanup

## Issue
`risk/test_risk.py` imported `RiskAssessment` model which does not exist in `risk/models.py`.

## Investigation

### Actual Models in risk/models.py:
1. **StudentRiskProfile** - Overall student risk profile (OneToOne with Student)
2. **SubjectRiskInsight** - Subject-level attendance analytics (FK to Student and Subject)

### Deprecated Model Referenced in test_risk.py:
- **RiskAssessment** - Does not exist in current architecture

## Root Cause
The test file was from an older architecture before the risk system was refactored to use:
- `StudentRiskProfile` for overall risk tracking
- `SubjectRiskInsight` for subject-level analytics
- `risk/services.py` for risk calculation logic

## Resolution
**Deleted `risk/test_risk.py`** - File contained deprecated tests for non-existent model

## Current Risk Architecture

### Models (risk/models.py)
```python
StudentRiskProfile:
  - student (OneToOne)
  - risk_score (Decimal)
  - risk_level (low/medium/high/critical)
  - last_calculated (DateTime)

SubjectRiskInsight:
  - student (FK)
  - subject (FK)
  - total_sessions (Int)
  - absence_count (Int)
  - late_count (Int)
  - absence_rate (Decimal)
```

### Services (risk/services.py)
- `update_risk_after_session()` - Main entry point
- `_update_subject_insight()` - Updates subject-level analytics
- `_calculate_subject_streak()` - Calculates consecutive absences per subject
- `_calculate_full_day_streak()` - Calculates full-day absence streaks
- `_update_overall_student_risk()` - Updates overall risk profile
- `_handle_alerts_and_interventions()` - Triggers alerts/interventions

## Test Coverage Status

### Existing Tests:
- ✅ `tests/test_attendance_views_coverage.py` - Tests risk service integration
- ✅ `tests/test_query_performance.py` - Tests risk profile queries

### Missing Tests (Recommended):
- ⚠️ Direct unit tests for `risk/services.py` functions
- ⚠️ Tests for risk level thresholds (low/medium/high/critical)
- ⚠️ Tests for streak calculations
- ⚠️ Tests for alert/intervention triggering

## Recommendation
Create new test file `tests/test_risk_services.py` to test current risk architecture:
- Test `update_risk_after_session()` with various attendance patterns
- Test risk level transitions (low → medium → high → critical)
- Test subject streak calculations
- Test full-day streak calculations
- Test alert/intervention automation

## Impact
- ✅ Removed deprecated test file
- ✅ No changes to actual models
- ✅ No breaking changes to existing functionality
- ⚠️ Risk services currently lack direct unit test coverage
