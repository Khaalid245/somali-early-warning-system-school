# Generated migration for enhanced subject model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0004_attendancescheduleview_timetabletemplate_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='subject',
            name='subject_type',
            field=models.CharField(
                choices=[('core', 'Core Subject'), ('elective', 'Elective'), ('activity', 'Activity/Sports'), ('language', 'Language')],
                default='core',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='subject',
            name='difficulty',
            field=models.CharField(
                choices=[('easy', 'Easy'), ('moderate', 'Moderate'), ('difficult', 'Difficult')],
                default='moderate',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='subject',
            name='priority',
            field=models.IntegerField(default=3, help_text='1=Highest (5 periods/week), 5=Lowest (1 period/week)'),
        ),
        migrations.AddField(
            model_name='subject',
            name='can_be_first_period',
            field=models.BooleanField(default=True, help_text='Can this subject be scheduled in Period 1?'),
        ),
        migrations.AddField(
            model_name='subject',
            name='preferred_periods',
            field=models.CharField(blank=True, help_text="Comma-separated period numbers, e.g., '1,2,3'", max_length=50),
        ),
        migrations.AlterModelOptions(
            name='subject',
            options={'ordering': ['priority', 'name']},
        ),
    ]
