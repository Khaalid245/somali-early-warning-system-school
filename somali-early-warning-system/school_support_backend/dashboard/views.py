from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from core.throttling import DashboardThrottle
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.conf import settings
import logging

from datetime import datetime

from .services import (
    get_admin_dashboard_data,
    get_form_master_dashboard_data,
    get_teacher_dashboard_data,
)

logger = logging.getLogger(__name__)


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
    throttle_classes = [DashboardThrottle]
    
    @extend_schema(
        tags=['Dashboard'],
        summary='Get role-based dashboard data',
        description='Returns dashboard data based on user role (Admin, Form Master, or Teacher)',
        parameters=[
            OpenApiParameter(
                name='start_date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Filter start date (YYYY-MM-DD)',
                required=False,
            ),
            OpenApiParameter(
                name='end_date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Filter end date (YYYY-MM-DD)',
                required=False,
            ),
            OpenApiParameter(
                name='risk_level',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by risk level',
                required=False,
                enum=['low', 'medium', 'high', 'critical'],
            ),
        ],
        examples=[
            OpenApiExample(
                'Admin Dashboard',
                value={
                    'role': 'admin',
                    'total_students': 500,
                    'active_alerts': 45,
                    'open_cases': 12,
                },
                response_only=True,
            ),
        ],
    )

    def get(self, request):
        user = request.user

        # ------------------------------------------------
        # Ensure role exists
        # ------------------------------------------------
        if not hasattr(user, "role"):
            raise PermissionDenied("User role not defined.")
        
        # Log admin dashboard access
        if user.role == "admin":
            logger.info(f"Admin dashboard accessed by user {user.id} ({user.email})")

        # ------------------------------------------------
        # FILTER PARAMETERS (Validated)
        # ------------------------------------------------
        try:
            start_date = validate_date(
                request.query_params.get("start_date")
            )
            end_date = validate_date(
                request.query_params.get("end_date")
            )
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)
        
        risk_level = request.query_params.get("risk_level")

        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "risk_level": risk_level,
        }

        # ------------------------------------------------
        # ROLE-BASED ROUTING WITH ERROR HANDLING
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
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=403)
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Dashboard error for user {user.id}: {e}")
            return Response({
                "error": "An error occurred loading the dashboard. Please try again.",
                "details": str(e) if settings.DEBUG else None
            }, status=500)
