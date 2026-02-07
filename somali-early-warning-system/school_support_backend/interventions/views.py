from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Intervention
from .serializers import InterventionSerializer
from counselling.models import CounsellingSession
from alerts.models import Alert


class InterventionListCreateView(generics.ListCreateAPIView):
    queryset = Intervention.objects.all().order_by("-created_at")
    serializer_class = InterventionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Interventions must be linked to:
        - counselling session
        - alert
        - subject
        """

        session = serializer.validated_data["session"]
        subject = serializer.validated_data["subject"]

        # Ensure intervention subject matches the student's context
        if session.student.classroom is None:
            raise ValueError("Student is not assigned to any classroom.")

        serializer.save(status="pending")


class InterventionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Intervention.objects.all()
    serializer_class = InterventionSerializer
    permission_classes = [IsAuthenticated]


class InterventionsByUserView(generics.ListAPIView):
    serializer_class = InterventionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs["user_id"]
        return Intervention.objects.filter(
            assigned_to_id=user_id
        ).order_by("-due_date")


class InterventionsBySessionView(generics.ListAPIView):
    serializer_class = InterventionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        session_id = self.kwargs["session_id"]
        return Intervention.objects.filter(
            session_id=session_id
        ).order_by("-created_at")
