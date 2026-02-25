import re
import html

def sanitize_html(value):
    """Remove HTML tags and escape special characters to prevent XSS"""
    if not value:
        return value
    
    # Remove HTML tags
    value = re.sub(r'<[^>]*>', '', str(value))
    
    # Escape HTML entities
    value = html.escape(value)
    
    # Remove javascript: and data: URLs
    value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
    value = re.sub(r'data:', '', value, flags=re.IGNORECASE)
    
    return value

def sanitize_dict(data):
    """Recursively sanitize dictionary values"""
    if isinstance(data, dict):
        return {k: sanitize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(item) for item in data]
    elif isinstance(data, str):
        return sanitize_html(data)
    return data
