"""
Cache Invalidation Signals for Dashboard
Automatically invalidates cache when data changes
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from attendance.models import AttendanceRecord
from alerts.models import Alert
from interventions.models import InterventionCase
import logging

logger = logging.getLogger(__name__)


def invalidate_teacher_cache(teacher_id):
    """Invalidate all cache keys for a specific teacher"""
    try:
        # Pattern: teacher_dashboard_{teacher_id}_*
        cache_pattern = f"teacher_dashboard_{teacher_id}_*"
        # Note: This requires Redis cache backend with pattern deletion support
        cache.delete_pattern(cache_pattern)
        logger.info(f"Invalidated cache for teacher {teacher_id}")
    except Exception as e:
        logger.error(f"Failed to invalidate cache for teacher {teacher_id}: {e}")


@receiver(post_save, sender=AttendanceRecord)
def invalidate_cache_on_attendance(sender, instance, **kwargs):
    """Invalidate teacher dashboard cache when attendance is recorded"""
    try:
        # Get teacher from the session's subject
        if hasattr(instance.session, 'subject'):
            for assignment in instance.session.subject.assignments.all():
                invalidate_teacher_cache(assignment.teacher_id)
    except Exception as e:
        logger.error(f"Error invalidating cache on attendance save: {e}")


@receiver(post_save, sender=Alert)
def invalidate_cache_on_alert(sender, instance, **kwargs):
    """Invalidate teacher dashboard cache when alert is created/updated"""
    try:
        if instance.subject is not None:
            for assignment in instance.subject.assignments.all():
                invalidate_teacher_cache(assignment.teacher_id)
    except Exception as e:
        logger.error(f"Error invalidating cache on alert save: {e}")


@receiver(post_save, sender=InterventionCase)
def invalidate_cache_on_case(sender, instance, **kwargs):
    """Invalidate form master cache when intervention case changes"""
    try:
        if instance.assigned_to:
            invalidate_teacher_cache(instance.assigned_to.id)
    except Exception as e:
        logger.error(f"Error invalidating cache on case save: {e}")


@receiver(post_delete, sender=AttendanceRecord)
@receiver(post_delete, sender=Alert)
@receiver(post_delete, sender=InterventionCase)
def invalidate_cache_on_delete(sender, instance, **kwargs):
    """Invalidate cache when records are deleted"""
    try:
        if sender == AttendanceRecord and hasattr(instance.session, 'subject'):
            for assignment in instance.session.subject.assignments.all():
                invalidate_teacher_cache(assignment.teacher_id)
        elif sender == Alert and instance.subject is not None:
            for assignment in instance.subject.assignments.all():
                invalidate_teacher_cache(assignment.teacher_id)
        elif sender == InterventionCase and instance.assigned_to:
            invalidate_teacher_cache(instance.assigned_to.id)
    except Exception as e:
        logger.error(f"Error invalidating cache on delete: {e}")
