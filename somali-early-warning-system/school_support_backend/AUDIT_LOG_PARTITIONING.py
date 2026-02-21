# Audit Log Partitioning Strategy
# For handling 1M+ audit log entries

# =====================================================
# OPTION 1: Time-based Partitioning (MySQL 8.0+)
# =====================================================

"""
CREATE TABLE core_auditlog (
    id BIGINT AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50),
    details JSON,
    timestamp DATETIME,
    PRIMARY KEY (id, timestamp)
)
PARTITION BY RANGE (YEAR(timestamp)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
"""

# =====================================================
# OPTION 2: Archive Old Logs (Simpler approach)
# =====================================================

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import AuditLog

class Command(BaseCommand):
    help = 'Archive audit logs older than 1 year'

    def handle(self, *args, **kwargs):
        one_year_ago = timezone.now() - timedelta(days=365)
        
        # Move to archive table
        old_logs = AuditLog.objects.filter(timestamp__lt=one_year_ago)
        count = old_logs.count()
        
        # Export to CSV before deleting
        import csv
        with open(f'audit_archive_{timezone.now().date()}.csv', 'w') as f:
            writer = csv.writer(f)
            writer.writerow(['ID', 'User', 'Action', 'Timestamp'])
            for log in old_logs.iterator(chunk_size=1000):
                writer.writerow([log.id, log.user_id, log.action, log.timestamp])
        
        # Delete old logs
        old_logs.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'Archived and deleted {count} old audit logs')
        )


# =====================================================
# OPTION 3: Separate Archive Table
# =====================================================

class AuditLogArchive(models.Model):
    """Archive table for old audit logs"""
    id = models.BigIntegerField(primary_key=True)
    user_id = models.IntegerField()
    action = models.CharField(max_length=50)
    details = models.JSONField()
    timestamp = models.DateTimeField()
    archived_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'core_auditlog_archive'
        indexes = [
            models.Index(fields=['user_id', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]


# =====================================================
# AUTOMATED ARCHIVAL (Run monthly via cron)
# =====================================================

def archive_old_audit_logs():
    """Move logs older than 90 days to archive table"""
    cutoff_date = timezone.now() - timedelta(days=90)
    
    old_logs = AuditLog.objects.filter(timestamp__lt=cutoff_date)
    
    # Bulk create in archive table
    archive_records = [
        AuditLogArchive(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            details=log.details,
            timestamp=log.timestamp
        )
        for log in old_logs.iterator(chunk_size=1000)
    ]
    
    AuditLogArchive.objects.bulk_create(archive_records, batch_size=1000)
    
    # Delete from main table
    old_logs.delete()
    
    return len(archive_records)


# =====================================================
# QUERY OPTIMIZATION FOR AUDIT LOGS
# =====================================================

# BAD: Slow with 1M records
AuditLog.objects.filter(user=user).order_by('-timestamp')

# GOOD: Fast with proper index
AuditLog.objects.filter(
    user=user,
    timestamp__gte=timezone.now() - timedelta(days=30)  # Last 30 days only
).order_by('-timestamp')[:100]

# BEST: Use pagination
from django.core.paginator import Paginator

logs = AuditLog.objects.filter(user=user).order_by('-timestamp')
paginator = Paginator(logs, 50)  # 50 per page
page = paginator.get_page(1)
