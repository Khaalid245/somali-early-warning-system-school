from rest_framework import serializers
from .models import Subject, TeachingAssignment


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["subject_id", "name"]


class TeachingAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingAssignment
        fields = ["assignment_id", "teacher", "subject", "classroom"]
