from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import CounsellingSession
from .serializers import CounsellingSessionSerializer
from alerts.models import Alert


class CounsellingSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = CounsellingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CounsellingSession.objects.all().order_by("-session_date")

        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        subject_id = self.request.query_params.get("subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        student = serializer.validated_data["student"]
        subject = serializer.validated_data["subject"]
        session_date = serializer.validated_data["session_date"]

        # Only counsellors can create counselling sessions
        if user.role != "counsellor":
            raise PermissionDenied("Only counsellors can create counselling sessions.")

        # Prevent duplicate counselling for same student + subject + day
        if CounsellingSession.objects.filter(
            student=student,
            subject=subject,
            session_date=session_date
        ).exists():
            raise ValueError("A counselling session already exists for this subject on this date.")

        session = serializer.save(counsellor=user)

        # Resolve only alerts related to this subject
        subject_alerts = Alert.objects.filter(
            student=student,
            subject=subject,
            status="active"
        )

        for alert in subject_alerts:
            alert.status = "resolved"
            alert.save()

        return session


class CounsellingSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CounsellingSession.objects.all()
    serializer_class = CounsellingSessionSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        updated_session = serializer.save()

        # Notify admin only once if student is not improving in this subject
        if updated_session.progress_status == "not_improving" and not updated_session.admin_notified:
            Alert.objects.create(
                student=updated_session.student,
                subject=updated_session.subject,
                alert_type=f"Admin Referral – {updated_session.subject.name}",
                risk_level="urgent",
                status="active"
            )

            updated_session.admin_notified = True
            updated_session.save()
