from rest_framework import serializers
from .models import AcademicTerm

class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = '__all__'
