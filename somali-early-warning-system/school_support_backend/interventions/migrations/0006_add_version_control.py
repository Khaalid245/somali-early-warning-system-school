# Generated migration file
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('interventions', '0005_interventioncase_escalation_reason'),
    ]

    operations = [
        migrations.AddField(
            model_name='interventioncase',
            name='version',
            field=models.IntegerField(default=1),
        ),
    ]
