# Database Indexes for InterventionCase Scalability
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('interventions', '0006_add_version_control'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='interventioncase',
            index=models.Index(
                fields=['assigned_to', 'status', '-created_at'],
                name='case_assigned_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='interventioncase',
            index=models.Index(
                fields=['student', 'status'],
                name='case_student_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='interventioncase',
            index=models.Index(
                fields=['progress_status', '-updated_at'],
                name='case_progress_idx'
            ),
        ),
    ]
