from django.db import migrations, models
import django.core.validators
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('risk', '0003_alter_studentriskprofile_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='subjectriskinsight',
            name='total_days',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='subjectriskinsight',
            name='absent_days',
            field=models.DecimalField(
                decimal_places=1, default=Decimal('0.0'), max_digits=5,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text='Distinct absent days (0.5 = half-day)'
            ),
        ),
        migrations.AddField(
            model_name='subjectriskinsight',
            name='late_days',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='subjectriskinsight',
            name='day_absence_rate',
            field=models.DecimalField(
                decimal_places=2, default=Decimal('0.00'), max_digits=5,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text='Absence rate based on distinct school days'
            ),
        ),
    ]
