# Database Indexes for Student Scalability
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('students', '0002_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='student',
            index=models.Index(
                fields=['student_id'],
                name='student_id_idx'
            ),
        ),
    ]
