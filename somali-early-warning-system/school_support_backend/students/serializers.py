from rest_framework import serializers
from .models import Classroom, Student

class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['class_id', 'name']


class StudentSerializer(serializers.ModelSerializer):
    classroom = ClassroomSerializer(read_only=True)
    classroom_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Student
        fields = [
            'student_id',
            'full_name',
            'class_level',
            'gender',
            'status',
            'classroom',
            'classroom_id'
        ]
