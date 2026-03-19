"""
Custom Throttle Classes for Rate Limiting
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """1000 login attempts per hour for development (10/hour in production)"""
    rate = '1000/hour'
    scope = 'login'


class SensitiveOperationThrottle(UserRateThrottle):
    """10 sensitive operations per hour for authenticated users"""
    rate = '10/hour'
    scope = 'sensitive'


class SensitiveEndpointThrottle(UserRateThrottle):
    """Alias for SensitiveOperationThrottle"""
    rate = '10/hour'
    scope = 'sensitive'


class FileUploadThrottle(UserRateThrottle):
    """10 file uploads per hour"""
    rate = '10/hour'
    scope = 'file_upload'


class BulkOperationThrottle(UserRateThrottle):
    """5 bulk operations per hour"""
    rate = '5/hour'
    scope = 'bulk'


class DashboardThrottle(UserRateThrottle):
    """100 dashboard requests per hour"""
    rate = '100/hour'
    scope = 'dashboard'


class AdminActionThrottle(UserRateThrottle):
    """20 admin actions per hour"""
    rate = '20/hour'
    scope = 'admin_action'
