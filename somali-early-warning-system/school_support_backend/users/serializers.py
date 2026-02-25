from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from .models import User
from core.xss_sanitizer import sanitize_html


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True, validators=[EmailValidator()])

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'phone', 'profile_image', 'biography', 'password']
        read_only_fields = ['id']

    def validate_name(self, value):
        """Sanitize name to prevent XSS"""
        return sanitize_html(value)
    
    def validate_phone(self, value):
        """Sanitize phone to prevent XSS"""
        if value:
            return sanitize_html(value)
        return value

    def validate_email(self, value):
        """Normalize email and check uniqueness (case-insensitive)"""
        normalized_email = value.lower().strip()
        
        # Check uniqueness (case-insensitive)
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return normalized_email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'profile_image', 'biography']
        read_only_fields = ['id', 'email']
    
    def validate_name(self, value):
        """Sanitize name to prevent XSS"""
        return sanitize_html(value)
    
    def validate_phone(self, value):
        """Sanitize phone to prevent XSS"""
        if value:
            return sanitize_html(value)
        return value
    
    def validate_biography(self, value):
        """Sanitize biography to prevent XSS"""
        if value:
            return sanitize_html(value)
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value
