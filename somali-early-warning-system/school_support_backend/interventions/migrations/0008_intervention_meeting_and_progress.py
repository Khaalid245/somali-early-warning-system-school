# Generated migration for intervention meeting and progress tracking

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('interventions', '0007_add_indexes'),
        ('students', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InterventionMeeting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('meeting_date', models.DateField()),
                ('absence_reason', models.TextField()),
                ('root_cause', models.CharField(choices=[('health', 'Health Issue'), ('family', 'Family Issue'), ('academic', 'Academic Difficulty'), ('financial', 'Financial Issue'), ('behavioral', 'Behavioral Issue'), ('other', 'Other')], max_length=20)),
                ('intervention_notes', models.TextField()),
                ('action_plan', models.TextField()),
                ('follow_up_date', models.DateField(blank=True, null=True)),
                ('urgency_level', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=10)),
                ('status', models.CharField(choices=[('open', 'Open'), ('monitoring', 'Monitoring'), ('improving', 'Improving'), ('not_improving', 'Not Improving'), ('escalated', 'Escalated'), ('closed', 'Closed')], default='open', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_meetings', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='intervention_meetings', to='students.student')),
            ],
            options={
                'ordering': ['-meeting_date', '-created_at'],
                'indexes': [
                    models.Index(fields=['student', 'status'], name='interventio_student_idx'),
                    models.Index(fields=['status'], name='interventio_status_idx'),
                    models.Index(fields=['urgency_level'], name='interventio_urgency_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='ProgressUpdate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('update_text', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progress_updates', to=settings.AUTH_USER_MODEL)),
                ('meeting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progress_updates', to='interventions.interventionmeeting')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='interventionmeeting',
            constraint=models.UniqueConstraint(condition=models.Q(('status__in', ['open', 'monitoring', 'improving', 'not_improving', 'escalated'])), fields=('student', 'root_cause'), name='unique_active_intervention_per_cause'),
        ),
    ]
