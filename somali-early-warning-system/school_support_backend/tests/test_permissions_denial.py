"""
Surgical Test for users/permissions.py lines 11, 16
Target: Permission denial branches
"""
import pytest
from unittest.mock import Mock


@pytest.mark.django_db
class TestPermissionDenialBranches:
    """Target lines 11, 16: Permission denial branches"""
    
    def test_form_master_or_admin_denies_teacher(self):
        """Line 11: IsFormMasterOrAdmin denies teacher"""
        from users.permissions import IsFormMasterOrAdmin
        
        permission = IsFormMasterOrAdmin()
        request = Mock()
        request.user = Mock()
        request.user.role = 'teacher'
        
        # This triggers line 11: return False for teacher
        result = permission.has_permission(request, None)
        assert result is False
    
    def test_admin_only_denies_form_master(self):
        """Line 16: IsAdminOnly denies form_master"""
        from users.permissions import IsAdminOnly
        
        permission = IsAdminOnly()
        request = Mock()
        request.user = Mock()
        request.user.role = 'form_master'
        
        # This triggers line 16: return False for form_master
        result = permission.has_permission(request, None)
        assert result is False