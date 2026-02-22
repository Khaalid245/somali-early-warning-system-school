"""
Test Coverage for core/mixins.py
Target: 0% → 80%+
Strategy: Test OptimisticLockMixin save branches only (update_with_version not used in codebase)
"""
import pytest
from django.core.exceptions import ValidationError
from interventions.models import InterventionCase


@pytest.mark.django_db
class TestOptimisticLockMixin:
    """Cover OptimisticLockMixin save branches"""
    
    def test_new_object_version_starts_at_1(self, student, form_master_user):
        """Branch: if not self.pk (new object)"""
        obj = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        assert obj.version == 1
    
    def test_update_increments_version(self, student, form_master_user):
        """Branch: if self.pk (existing object)"""
        obj = InterventionCase.objects.create(
            student=student,
            assigned_to=form_master_user,
            status='open'
        )
        
        obj.status = 'in_progress'
        obj.save()
        assert obj.version == 2
