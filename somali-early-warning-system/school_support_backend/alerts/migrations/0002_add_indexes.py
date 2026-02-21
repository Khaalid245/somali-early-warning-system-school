# Database Indexes for Alert Scalability
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('alerts', '0002_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(
                fields=['assigned_to', 'status', '-alert_date'],
                name='alert_assigned_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='alert',
            index=models.Index(
                fields=['student', 'risk_level', 'status'],
                name='alert_student_idx'
            ),
        ),
    ]
