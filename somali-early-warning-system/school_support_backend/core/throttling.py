from rest_framework.throttling import UserRateThrottle

class SensitiveEndpointThrottle(UserRateThrottle):
    """Rate limit for sensitive operations like password change, 2FA, user creation"""
    rate = '10/hour'

class FileUploadThrottle(UserRateThrottle):
    """Rate limit for file uploads"""
    rate = '20/hour'
