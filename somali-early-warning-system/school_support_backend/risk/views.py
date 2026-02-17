from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import StudentRiskProfile, SubjectRiskInsight
from .serializers import (
    StudentRiskProfileSerializer,
    SubjectRiskInsightSerializer,
)


# -----------------------------------
# OVERALL STUDENT RISK
# -----------------------------------
class StudentRiskListView(generics.ListAPIView):
    """
    List overall student risk profiles.
    """
    serializer_class = StudentRiskProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = StudentRiskProfile.objects.all()

        student_id = self.request.query_params.get("student")
        risk_level = self.request.query_params.get("level")

        if student_id:
            qs = qs.filter(student_id=student_id)

        if risk_level:
            qs = qs.filter(risk_level=risk_level)

        return qs


class StudentRiskDetailView(generics.RetrieveAPIView):
    """
    Retrieve single student's overall risk.
    """
    queryset = StudentRiskProfile.objects.all()
    serializer_class = StudentRiskProfileSerializer
    permission_classes = [IsAuthenticated]


# -----------------------------------
# SUBJECT-LEVEL ANALYTICS
# -----------------------------------
class SubjectRiskInsightListView(generics.ListAPIView):
    """
    List subject-based attendance analytics.
    """
    serializer_class = SubjectRiskInsightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = SubjectRiskInsight.objects.all()

        student_id = self.request.query_params.get("student")
        subject_id = self.request.query_params.get("subject")

        if student_id:
            qs = qs.filter(student_id=student_id)

        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        return qs


class SubjectRiskInsightDetailView(generics.RetrieveAPIView):
    """
    Retrieve subject analytics for a student.
    """
    queryset = SubjectRiskInsight.objects.all()
    serializer_class = SubjectRiskInsightSerializer
    permission_classes = [IsAuthenticated]
