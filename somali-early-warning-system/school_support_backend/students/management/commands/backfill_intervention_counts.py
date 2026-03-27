from django.core.management.base import BaseCommand
from students.models import Student
from interventions.models import InterventionCase


class Command(BaseCommand):
    help = 'Backfill intervention_count and chronic_absentee for all students from closed case history'

    def handle(self, *args, **options):
        fixed = 0
        for student in Student.objects.all():
            closed_count = InterventionCase.objects.filter(student=student, status='closed').count()
            is_chronic = closed_count >= 3
            if closed_count != student.intervention_count or is_chronic != student.chronic_absentee:
                Student.objects.filter(pk=student.pk).update(
                    intervention_count=closed_count,
                    chronic_absentee=is_chronic,
                )
                self.stdout.write(
                    f'  {student.full_name}: intervention_count={closed_count}, chronic={is_chronic}'
                )
                fixed += 1
        self.stdout.write(self.style.SUCCESS(f'Done. Fixed {fixed} students.'))
