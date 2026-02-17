from django.contrib import admin
from .models import Classroom, Student, StudentEnrollment


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ("name", "academic_year", "form_master", "is_active")
    list_filter = ("academic_year", "is_active")
    search_fields = ("name",)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "admission_number", "status", "is_active")
    list_filter = ("status", "gender", "is_active")
    search_fields = ("full_name", "admission_number")


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "classroom", "academic_year", "is_active")
    list_filter = ("academic_year", "is_active")
    search_fields = ("student__full_name", "student__admission_number")
