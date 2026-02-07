from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import RiskProfile
from .serializers import RiskProfileSerializer
from alerts.models import Alert


class RiskProfileListView(generics.ListAPIView):
    """
    Read-only list of subject-based risk profiles.
    """
    serializer_class = RiskProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = RiskProfile.objects.all()

        # Optional filters
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        subject_id = self.request.query_params.get("subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        return qs


class RiskProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    Allows counsellors/admins to adjust subject risk.
    """
    serializer_class = RiskProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RiskProfile.objects.all()

    def perform_update(self, serializer):
        old = self.get_object()
        new = serializer.save()

        # Create subject-based alert when risk moves to HIGH
        if old.risk_level != new.risk_level and new.risk_level.lower() == "high":
            Alert.objects.create(
                student=new.student,
                alert_type=f"High Risk in {new.subject.name}",
                risk_level=new.risk_level,
                status="active"
            )
