# Risk Calculation Constants
ABSENCE_THRESHOLD_SUBJECT = 7  # Subject absences to trigger alert
ABSENCE_THRESHOLD_FULL_DAY = 5  # Full day absences to trigger alert
ABSENCE_PENALTY_LOW = 15  # Points for 3 absences
ABSENCE_PENALTY_MEDIUM = 25  # Points for 5 absences
ABSENCE_PENALTY_HIGH = 40  # Points for 7+ absences

# Risk Levels
RISK_SCORE_HIGH = 55  # Score threshold for high risk
RISK_SCORE_CRITICAL = 75  # Score threshold for critical risk

# Alert Settings
MAX_URGENT_ALERTS = 5  # Maximum urgent alerts to show on dashboard

# Pagination
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 100

# Rate Limiting
LOGIN_ATTEMPTS_LIMIT = 5
LOGIN_LOCKOUT_DURATION = 300  # seconds (5 minutes)

# Cache Timeouts (seconds)
CACHE_TIMEOUT_DASHBOARD = 300  # 5 minutes
CACHE_TIMEOUT_STUDENTS = 600  # 10 minutes
CACHE_TIMEOUT_ATTENDANCE = 180  # 3 minutes
