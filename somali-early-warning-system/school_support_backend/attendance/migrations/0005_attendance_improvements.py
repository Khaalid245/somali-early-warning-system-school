# Generated migration for attendance improvements

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0004_attendancesessionarchive_attendancerecordarchive_and_more'),
    ]

    operations = [
        # Add period and recorded_at to AttendanceSession
        migrations.AddField(
            model_name='attendancesession',
            name='period',
            field=models.CharField(
                choices=[
                    ('1', 'Period 1'), ('2', 'Period 2'), ('3', 'Period 3'),
                    ('4', 'Period 4'), ('5', 'Period 5'), ('6', 'Period 6'),
                    ('morning', 'Morning Session'), ('afternoon', 'Afternoon Session')
                ],
                default='1',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='attendancesession',
            name='recorded_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        
        # Add marked_at to AttendanceRecord
        migrations.AddField(
            model_name='attendancerecord',
            name='marked_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        
        # Update unique constraint to include period
        migrations.AlterUniqueTogether(
            name='attendancesession',
            unique_together={('classroom', 'subject', 'attendance_date', 'period')},
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name='attendancesession',
            index=models.Index(fields=['recorded_at'], name='attendance_session_recorded_at_idx'),
        ),
        migrations.AddIndex(
            model_name='attendancerecord',
            index=models.Index(fields=['marked_at'], name='attendance_record_marked_at_idx'),
        ),
        
        # Create SchoolSettings model
        migrations.CreateModel(
            name='SchoolSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('consecutive_absence_threshold', models.IntegerField(default=3, help_text='Days of consecutive absence before alert')),
                ('monthly_absence_threshold', models.IntegerField(default=5, help_text='Monthly absences before intervention')),
                ('late_arrival_minutes', models.IntegerField(default=15, help_text='Minutes late before marked as tardy')),
                ('tardy_threshold', models.IntegerField(default=3, help_text='Tardies per week before alert')),
                ('parent_notification_enabled', models.BooleanField(default=True)),
                ('admin_notification_enabled', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'School Settings',
                'verbose_name_plural': 'School Settings',
            },
        ),
        
        # Create AttendanceAudit model
        migrations.CreateModel(
            name='AttendanceAudit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('create', 'Created'), ('update', 'Updated'), ('delete', 'Deleted')], max_length=10)),
                ('old_status', models.CharField(blank=True, max_length=10, null=True)),
                ('new_status', models.CharField(blank=True, max_length=10, null=True)),
                ('old_remarks', models.TextField(blank=True, null=True)),
                ('new_remarks', models.TextField(blank=True, null=True)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('reason', models.TextField(blank=True, null=True)),
                ('changed_by', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='attendance_changes', to='users.user')),
                ('record', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='audit_logs', to='attendance.attendancerecord')),
            ],
            options={
                'ordering': ['-changed_at'],
            },
        ),
        
        # Add indexes for audit model
        migrations.AddIndex(
            model_name='attendanceaudit',
            index=models.Index(fields=['record', 'changed_at'], name='attendance_audit_record_changed_idx'),
        ),
        migrations.AddIndex(
            model_name='attendanceaudit',
            index=models.Index(fields=['changed_by'], name='attendance_audit_changed_by_idx'),
        ),
    ]