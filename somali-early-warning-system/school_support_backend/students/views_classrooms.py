from rest_framework import generics
from .models import Classroom
from .serializers import ClassroomSerializer
from rest_framework.permissions import IsAuthenticated


class ClassroomListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Classroom.objects.all()
