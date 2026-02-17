from django.db import models
from users.models import User


# -----------------------------------
# CLASSROOM (Year-Based)
# -----------------------------------
class Classroom(models.Model):

    class_id = models.AutoField(primary_key=True)

    name = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)

    form_master = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "form_master"},
        related_name="managed_classrooms"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("name", "academic_year")

    def __str__(self):
        return f"{self.name} ({self.academic_year})"


# -----------------------------------
# STUDENT (Permanent Identity)
# -----------------------------------
class Student(models.Model):

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("transferred", "Transferred"),
        ("graduated", "Graduated"),
        ("suspended", "Suspended"),
    ]

    student_id = models.AutoField(primary_key=True)

    admission_number = models.CharField(max_length=50, unique=True)

    full_name = models.CharField(max_length=120)

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.admission_number})"


# -----------------------------------
# STUDENT ENROLLMENT (THIS IS KEY)
# -----------------------------------
class StudentEnrollment(models.Model):

    enrollment_id = models.AutoField(primary_key=True)

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    academic_year = models.CharField(max_length=20)

    enrollment_date = models.DateField(auto_now_add=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("student", "academic_year")

    def __str__(self):
        return f"{self.student.full_name} - {self.classroom.name} ({self.academic_year})"
