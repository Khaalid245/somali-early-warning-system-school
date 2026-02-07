from django.db import models

class Classroom(models.Model):
    class_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=120)
    class_level = models.CharField(max_length=50)
    gender = models.CharField(max_length=10)
    status = models.CharField(max_length=20, default="active")

    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE)

    def __str__(self):
        return self.full_name
