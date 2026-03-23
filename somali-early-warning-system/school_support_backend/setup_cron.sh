#!/bin/bash
# Setup script: installs the attendance reminder cron job on the production server.
# Run once as the user that owns the Django process (e.g. www-data or your deploy user).
#
# Usage:
#   chmod +x setup_cron.sh
#   ./setup_cron.sh /path/to/venv/bin/python /path/to/school_support_backend

PYTHON=${1:-"/path/to/venv/bin/python"}
MANAGE=${2:-"/path/to/school_support_backend"}/manage.py
LOG="/var/log/school_support/reminders.log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname $LOG)"

# Build the cron line: runs at 11:00 AM Monday–Friday
CRON_LINE="0 11 * * 1-5 $PYTHON $MANAGE send_attendance_reminders >> $LOG 2>&1"

# Add to crontab only if not already present
( crontab -l 2>/dev/null | grep -v "send_attendance_reminders"; echo "$CRON_LINE" ) | crontab -

echo "Cron job installed:"
crontab -l | grep send_attendance_reminders
echo ""
echo "Reminders will run at 11:00 AM every Monday–Friday."
echo "Logs will be written to: $LOG"
echo ""
echo "To test immediately (dry run):"
echo "  $PYTHON $MANAGE send_attendance_reminders --dry-run"
echo ""
echo "To remove the cron job:"
echo "  crontab -l | grep -v send_attendance_reminders | crontab -"
