# Database Connection Pooling Configuration
# Add to settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'school_support_db'),
        'USER': os.getenv('DB_USER', 'django_user'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
        # =====================================================
        # CONNECTION POOLING - Critical for 5,000 concurrent users
        # =====================================================
        'CONN_MAX_AGE': 600,  # Keep connections alive for 10 minutes
        'CONN_HEALTH_CHECKS': True,  # Check connection health before use
    }
}

# =====================================================
# ADDITIONAL SETTINGS FOR SCALE
# =====================================================

# Database connection pool size (requires django-db-pool)
# pip install django-db-pool
DATABASES['default']['ENGINE'] = 'django_db_pool.backends.mysql'
DATABASES['default']['POOL_OPTIONS'] = {
    'POOL_SIZE': 20,  # Number of connections to keep open
    'MAX_OVERFLOW': 10,  # Additional connections when pool is full
    'RECYCLE': 3600,  # Recycle connections after 1 hour
    'TIMEOUT': 30,  # Wait 30s for connection before failing
}

# Query optimization
DATABASES['default']['OPTIONS']['connect_timeout'] = 10

# =====================================================
# CACHING - For frequently accessed data
# =====================================================
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
        'TIMEOUT': 300,  # 5 minutes
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

# =====================================================
# SESSION MANAGEMENT - For 5,000 concurrent users
# =====================================================
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1800  # 30 minutes
SESSION_SAVE_EVERY_REQUEST = False  # Don't update session on every request
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# =====================================================
# QUERY OPTIMIZATION
# =====================================================
# Log slow queries (> 500ms)
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'filters': ['slow_queries'],
        },
    },
    'filters': {
        'slow_queries': {
            '()': 'django.utils.log.CallbackFilter',
            'callback': lambda record: 'slow' in record.getMessage().lower()
        }
    }
}
