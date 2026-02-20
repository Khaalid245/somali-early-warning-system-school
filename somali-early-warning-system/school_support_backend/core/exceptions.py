from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """Custom exception handler for better error messages"""
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log the error
        logger.error(f"API Error: {exc}", exc_info=True, extra={'context': context})
        
        # Customize error response
        custom_response = {
            'success': False,
            'error': response.data.get('detail', str(exc)),
            'status_code': response.status_code
        }
        
        # Add field errors if present
        if isinstance(response.data, dict):
            errors = {k: v for k, v in response.data.items() if k != 'detail'}
            if errors:
                custom_response['errors'] = errors
        
        return Response(custom_response, status=response.status_code)
    
    # Handle unexpected errors
    logger.critical(f"Unhandled exception: {exc}", exc_info=True, extra={'context': context})
    return Response({
        'success': False,
        'error': 'An unexpected error occurred. Please try again later.',
        'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
