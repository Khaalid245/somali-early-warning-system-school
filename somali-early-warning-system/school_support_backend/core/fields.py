"""
Custom Encrypted Field for Django Models
Automatically encrypts/decrypts data when saving/loading
"""
from django.db import models
from core.encryption import encrypt_data, decrypt_data


class EncryptedCharField(models.CharField):
    """CharField that automatically encrypts/decrypts data"""
    
    def get_prep_value(self, value):
        """Encrypt before saving to database"""
        if value is None:
            return value
        return encrypt_data(str(value))
    
    def from_db_value(self, value, expression, connection):
        """Decrypt when loading from database"""
        if value is None:
            return value
        return decrypt_data(value)
    
    def to_python(self, value):
        """Convert to Python string"""
        if isinstance(value, str) or value is None:
            return value
        return str(value)


class EncryptedEmailField(models.EmailField):
    """EmailField that automatically encrypts/decrypts data"""
    
    def get_prep_value(self, value):
        """Encrypt before saving to database"""
        if value is None:
            return value
        return encrypt_data(str(value))
    
    def from_db_value(self, value, expression, connection):
        """Decrypt when loading from database"""
        if value is None:
            return value
        return decrypt_data(value)
    
    def to_python(self, value):
        """Convert to Python string"""
        if isinstance(value, str) or value is None:
            return value
        return str(value)
