from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from datetime import datetime

from .services import (
    get_admin_dashboard_data,
    get_form_master_dashboard_data,
    get_teacher_dashboard_data,
)


# ============================================================
# HELPER: VALIDATE DATE FORMAT (YYYY-MM-DD)
# ============================================================

def validate_date(date_string):
    if not date_string:
        return None

    try:
        return datetime.strptime(date_string, "%Y-%m-%d").date()
    except ValueError:
        raise ValidationError(
            "Invalid date format. Use YYYY-MM-DD."
        )


# ============================================================
# MAIN DASHBOARD VIEW (ROLE BASED)
# ============================================================

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # ------------------------------------------------
        # Ensure role exists
        # ------------------------------------------------
        if not hasattr(user, "role"):
            raise PermissionDenied("User role not defined.")

        # ------------------------------------------------
        # FILTER PARAMETERS (Validated)
        # ------------------------------------------------
        start_date = validate_date(
            request.query_params.get("start_date")
        )
        end_date = validate_date(
            request.query_params.get("end_date")
        )
        risk_level = request.query_params.get("risk_level")

        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "risk_level": risk_level,
        }

        # ------------------------------------------------
        # ROLE-BASED ROUTING
        # ------------------------------------------------
        try:
            if user.role == "admin":
                data = get_admin_dashboard_data(user, filters)

            elif user.role == "form_master":
                data = get_form_master_dashboard_data(user, filters)

            elif user.role == "teacher":
                data = get_teacher_dashboard_data(user, filters)

            else:
                raise PermissionDenied(
                    "No dashboard available for this role."
                )

            return Response(data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
