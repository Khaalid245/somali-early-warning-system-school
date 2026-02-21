# Generated migration to remove MySQL-incompatible constraint

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('interventions', '0009_remove_interventioncase_case_assigned_idx_and_more'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='interventionmeeting',
            name='unique_active_intervention_per_cause',
        ),
    ]
