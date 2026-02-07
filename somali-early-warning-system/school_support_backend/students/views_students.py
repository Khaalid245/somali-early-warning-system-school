from rest_framework import generics
from .models import Student
from .serializers import StudentSerializer
from rest_framework.permissions import IsAuthenticated


class StudentListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Student.objects.all()


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Student.objects.all()
