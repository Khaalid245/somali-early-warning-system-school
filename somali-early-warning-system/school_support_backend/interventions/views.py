from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone

from .models import InterventionCase
from .serializers import InterventionCaseSerializer
from alerts.models import Alert


# =====================================================
# LIST & CREATE INTERVENTION CASE
# =====================================================
class InterventionCaseListCreateView(generics.ListCreateAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = InterventionCase.objects.all()

        # Admin sees everything
        if user.role == "admin":
            return qs

        # Form master sees only assigned cases
        if user.role == "form_master":
            return qs.filter(assigned_to=user)

        return InterventionCase.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in ["admin", "form_master"]:
            raise PermissionDenied("Not allowed to create intervention cases.")

        student = serializer.validated_data.get("student")

        if not student:
            raise PermissionDenied("Intervention case must be linked to a student.")

        # If form master creates, auto assign to themselves
        if user.role == "form_master":
            serializer.save(assigned_to=user)
        else:
            serializer.save()


# =====================================================
# DETAIL / UPDATE / DELETE
# =====================================================
class InterventionCaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InterventionCase.objects.all()
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        user = self.request.user
        case = self.get_object()

        # Permission rules
        if user.role == "form_master" and case.assigned_to != user:
            raise PermissionDenied("You cannot update this case.")

        if user.role not in ["admin", "form_master"]:
            raise PermissionDenied("Permission denied.")

        updated_case = serializer.save()

        # =====================================================
        # 🔥 AUTO RESOLVE ALERT WHEN ALL CASES ARE CLOSED
        # =====================================================
        if (
            updated_case.status == "closed"
            and updated_case.alert_id
        ):
            alert = updated_case.alert

            # Check if ANY open cases still exist
            open_cases_exist = InterventionCase.objects.filter(
                alert=alert
            ).exclude(status="closed").exists()

            # Only resolve if no open cases remain
            if not open_cases_exist and alert.status != "resolved":
                alert.status = "resolved"
                alert.updated_at = timezone.now()
                alert.save()


# =====================================================
# INTERVENTIONS BY ALERT
# =====================================================
class InterventionsByAlertView(generics.ListAPIView):
    serializer_class = InterventionCaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        alert_id = self.kwargs["alert_id"]
        return InterventionCase.objects.filter(alert_id=alert_id)
