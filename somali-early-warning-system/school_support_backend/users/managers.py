from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):

    def create_user(self, email, name, role, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")

        if not password:
            raise ValueError("Users must have a password")

        if role not in dict(self.model.ROLE_CHOICES):
            raise ValueError("Invalid role provided")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            name=name,
            role=role,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)
        return user


    def create_superuser(self, email, password=None, **extra_fields):
        """
        Django calls this automatically.
        Must accept **extra_fields.
        """

        extra_fields.setdefault("name", "Admin")
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("role") != "admin":
            raise ValueError("Superuser must have role='admin'.")

        return self.create_user(
            email=email,
            name=extra_fields.get("name"),
            role=extra_fields.get("role"),
            password=password,
            is_staff=True,
            is_superuser=True
        )
