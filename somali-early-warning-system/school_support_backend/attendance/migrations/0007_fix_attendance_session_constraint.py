# Generated migration to fix attendance session constraint

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0006_rename_attendance_audit_record_changed_idx_attendance__record__b77806_idx_and_more'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='attendancesession',
            unique_together={('classroom', 'subject', 'teacher', 'attendance_date', 'period')},
        ),
    ]
