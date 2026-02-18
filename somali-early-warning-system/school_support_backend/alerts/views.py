from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Alert
from .serializers import AlertSerializer


# =====================================================
# ALERT LIST & CREATE
# =====================================================
class AlertListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Alert.objects.all().order_by("-alert_date")

        # --------------------------------------------
        # ROLE-BASED ACCESS CONTROL
        # --------------------------------------------
        if user.role == "admin":
            return qs

        elif user.role == "form_master":
            return qs.filter(assigned_to=user)

        elif user.role == "teacher":
            return qs.filter(
                subject__teachingassignment__teacher=user
            ).distinct()

        return Alert.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        # Only admin can manually create alerts
        if user.role != "admin":
            raise PermissionDenied("Only admin can manually create alerts.")

        serializer.save(status="active")


# =====================================================
# ALERT DETAIL & WORKFLOW UPDATE
# =====================================================
class AlertDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    # 🔒 OBJECT-LEVEL SECURITY
    def get_queryset(self):
        user = self.request.user
        qs = Alert.objects.all()

        if user.role == "admin":
            return qs

        elif user.role == "form_master":
            return qs.filter(assigned_to=user)

        elif user.role == "teacher":
            return qs.filter(
                subject__teachingassignment__teacher=user
            ).distinct()

        return Alert.objects.none()

    def patch(self, request, *args, **kwargs):

        alert = self.get_object()
        user = request.user
        new_status = request.data.get("status")

        valid_statuses = [
            "active",
            "under_review",
            "escalated",
            "resolved",
            "dismissed",
        ]

        if new_status not in valid_statuses:
            return Response(
                {"error": "Invalid status transition."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # FORM MASTER WORKFLOW
        # -------------------------------------------------
        if user.role == "form_master":

            if alert.assigned_to != user:
                raise PermissionDenied("This alert is not assigned to you.")

            if alert.status == "resolved":
                raise PermissionDenied("Resolved alerts cannot be modified.")

            allowed_transitions = [
                "under_review",
                "escalated",
                "resolved",
            ]

            if new_status not in allowed_transitions:
                raise PermissionDenied("Invalid action for form master.")

            alert.status = new_status

            if new_status == "escalated":
                alert.escalated_to_admin = True

        # -------------------------------------------------
        # ADMIN WORKFLOW
        # -------------------------------------------------
        elif user.role == "admin":

            alert.status = new_status

        # -------------------------------------------------
        # BLOCK EVERYONE ELSE
        # -------------------------------------------------
        else:
            raise PermissionDenied("You do not have permission to update alerts.")

        alert.save()

        return Response({
            "message": "Alert updated successfully.",
            "alert": AlertSerializer(alert).data
        })
