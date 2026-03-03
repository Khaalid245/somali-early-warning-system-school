# Data Archival Implementation - Setup Instructions

## Step 3.4: Run Migrations

```bash
cd school_support_backend
python manage.py makemigrations attendance
python manage.py migrate
```

## Step 3.5: Test Archival (Dry Run)

```bash
# See what would be archived (no changes made)
python manage.py archive_attendance_data --dry-run
```

Expected output:
```
============================================================
ATTENDANCE DATA ARCHIVAL
============================================================

DRY RUN MODE - No data will be modified

Archive cutoff date: 2024-02-26
Archiving data older than 730 days (2.0 years)

Sessions to archive: X
Records to archive: Y

Dry run complete. Use without --dry-run to actually archive.
```

## Step 3.6: Run Actual Archival

```bash
# Actually archive the data
python manage.py archive_attendance_data
```

You'll be asked to confirm:
```
This will move data to archive tables.
Continue? (yes/no): yes
```

## Step 3.7: Verify Archival

```python
# In Django shell
python manage.py shell

from attendance.models import AttendanceRecord, AttendanceRecordArchive
from attendance.archive_service import AttendanceService

# Check counts
current_count = AttendanceRecord.objects.count()
archive_count = AttendanceRecordArchive.objects.count()

print(f"Current records: {current_count}")
print(f"Archived records: {archive_count}")

# Test service layer (gets both)
total = AttendanceService.get_attendance_count()
print(f"Total (current + archive): {total}")

# Test getting student data
records = AttendanceService.get_student_attendance(student_id=1)
print(f"Student records (all time): {len(records)}")
```

## Step 3.8: Schedule Monthly Archival (Optional)

### Windows Task Scheduler:
```
Task: Archive Attendance Data
Trigger: Monthly, 1st day, 2:00 AM
Action: python C:\path\to\manage.py archive_attendance_data
```

### Linux Cron:
```bash
# Edit crontab
crontab -e

# Add this line (runs 1st of every month at 2 AM)
0 2 1 * * cd /path/to/project && /path/to/venv/bin/python manage.py archive_attendance_data
```

## Files Created:

1. ✅ `attendance/models.py` - Added archive models
2. ✅ `attendance/archive_service.py` - Service layer for transparent access
3. ✅ `attendance/management/commands/archive_attendance_data.py` - Archival command

## Next Steps:

After running migrations and testing, update your views to use the service layer:

```python
# OLD WAY (only searches current data)
records = AttendanceRecord.objects.filter(student_id=123)

# NEW WAY (searches current + archived automatically)
from attendance.archive_service import AttendanceService
records = AttendanceService.get_student_attendance(student_id=123)
```

This ensures users always see complete data!
