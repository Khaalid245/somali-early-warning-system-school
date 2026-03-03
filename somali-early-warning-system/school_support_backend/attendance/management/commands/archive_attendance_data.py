"""
Django Management Command: Archive Old Attendance Data
Usage: python manage.py archive_attendance_data [--dry-run] [--days=730]
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from attendance.models import (
    AttendanceSession, AttendanceRecord,
    AttendanceSessionArchive, AttendanceRecordArchive
)


class Command(BaseCommand):
    help = 'Archive old attendance data (default: 2+ years old)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be archived without actually archiving',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=730,
            help='Archive data older than this many days (default: 730 = 2 years)',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days = options['days']
        
        cutoff_date = timezone.now().date() - timedelta(days=days)
        
        self.stdout.write(self.style.SUCCESS(f'\n{"="*60}'))
        self.stdout.write(self.style.SUCCESS('ATTENDANCE DATA ARCHIVAL'))
        self.stdout.write(self.style.SUCCESS(f'{"="*60}\n'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be modified\n'))
        
        self.stdout.write(f'Archive cutoff date: {cutoff_date}')
        self.stdout.write(f'Archiving data older than {days} days ({days/365:.1f} years)\n')
        
        # Count records to archive
        sessions_to_archive = AttendanceSession.objects.filter(
            attendance_date__lt=cutoff_date
        )
        session_count = sessions_to_archive.count()
        
        records_to_archive = AttendanceRecord.objects.filter(
            session__attendance_date__lt=cutoff_date
        )
        record_count = records_to_archive.count()
        
        self.stdout.write(f'Sessions to archive: {session_count:,}')
        self.stdout.write(f'Records to archive: {record_count:,}\n')
        
        if session_count == 0:
            self.stdout.write(self.style.SUCCESS('No data to archive. Database is up to date!'))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nDry run complete. Use without --dry-run to actually archive.'))
            return
        
        # Confirm before proceeding
        self.stdout.write(self.style.WARNING('\nThis will move data to archive tables.'))
        confirm = input('Continue? (yes/no): ')
        
        if confirm.lower() != 'yes':
            self.stdout.write(self.style.ERROR('Archival cancelled.'))
            return
        
        # Perform archival
        self.stdout.write('\nArchiving data...')
        
        try:
            with transaction.atomic():
                archived_sessions = 0
                archived_records = 0
                
                # Archive sessions in batches
                for session in sessions_to_archive.iterator(chunk_size=1000):
                    # Create archive session
                    archive_session = AttendanceSessionArchive.objects.create(
                        classroom=session.classroom,
                        subject=session.subject,
                        teacher=session.teacher,
                        attendance_date=session.attendance_date,
                        created_at=session.created_at,
                        updated_at=session.updated_at,
                    )
                    
                    # Archive related records
                    for record in session.records.all():
                        AttendanceRecordArchive.objects.create(
                            session=archive_session,
                            student=record.student,
                            status=record.status,
                            remarks=record.remarks,
                            created_at=record.created_at,
                        )
                        archived_records += 1
                    
                    archived_sessions += 1
                    
                    # Progress indicator
                    if archived_sessions % 100 == 0:
                        self.stdout.write(f'  Archived {archived_sessions:,} sessions...')
                
                # Delete original data
                self.stdout.write('\nDeleting original data from main tables...')
                deleted_records = records_to_archive.delete()[0]
                deleted_sessions = sessions_to_archive.delete()[0]
                
                self.stdout.write(self.style.SUCCESS(f'\n{"="*60}'))
                self.stdout.write(self.style.SUCCESS('ARCHIVAL COMPLETE'))
                self.stdout.write(self.style.SUCCESS(f'{"="*60}'))
                self.stdout.write(self.style.SUCCESS(f'Sessions archived: {archived_sessions:,}'))
                self.stdout.write(self.style.SUCCESS(f'Records archived: {archived_records:,}'))
                self.stdout.write(self.style.SUCCESS(f'Sessions deleted from main table: {deleted_sessions:,}'))
                self.stdout.write(self.style.SUCCESS(f'Records deleted from main table: {deleted_records:,}\n'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\nError during archival: {str(e)}'))
            self.stdout.write(self.style.ERROR('Transaction rolled back. No data was modified.'))
            raise
