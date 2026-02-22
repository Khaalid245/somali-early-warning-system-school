"""
Test Settings - Uses SQLite for faster testing
"""
from school_support_backend.settings import *

# Remove django_extensions if not installed
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django_extensions']

# Use SQLite for testing (faster, no MySQL dependency)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # In-memory database for speed
    }
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable logging during tests
LOGGING = {}

# Disable debug toolbar if installed
DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda request: False,
}
