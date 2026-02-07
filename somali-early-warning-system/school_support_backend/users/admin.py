from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("name", "email", "role")


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = ("name", "email", "role", "status")


class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm

    model = User
    list_display = ("id", "name", "email", "role", "status", "is_active")
    list_filter = ("role", "is_active")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("name", "role", "status")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("name", "email", "role", "password1", "password2"),
        }),
    )

    search_fields = ("email",)
    ordering = ("email",)


admin.site.register(User, UserAdmin)
