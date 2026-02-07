from django.contrib.auth.models import BaseUserManager

class UserManager(BaseUserManager):

    def create_user(self, email, name, role, password=None):
        if not email:
            raise ValueError("Users must have an email address")

        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, role="admin", password=None):
        user = self.create_user(email, name, role, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user
