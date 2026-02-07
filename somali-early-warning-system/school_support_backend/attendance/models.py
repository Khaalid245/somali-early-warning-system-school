from django.db import models
from students.models import Student
from users.models import User
from academics.models import Subject


class Attendance(models.Model):
    attendance_id = models.AutoField(primary_key=True)
    attendance_date = models.DateField()
    status = models.CharField(max_length=20)  # present, absent, late
    remarks = models.TextField(blank=True, null=True)

    student = models.ForeignKey(Student, on_delete=models.CASCADE)

    # NEW: Subject for which attendance is taken
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)

    # Teacher who recorded the attendance
    recorded_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("student", "subject", "attendance_date")

    def __str__(self):
        return f"{self.student.full_name} - {self.subject.name} - {self.attendance_date}"
