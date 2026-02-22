"""
Test Coverage for core/constants.py
Target: 0% → 100%
Strategy: Import and verify constants exist
"""
import pytest
from core import constants


def test_absence_thresholds_exist():
    """Verify absence threshold constants"""
    assert constants.ABSENCE_THRESHOLD_SUBJECT == 7
    assert constants.ABSENCE_THRESHOLD_FULL_DAY == 5
    assert constants.ABSENCE_PENALTY_LOW == 15
    assert constants.ABSENCE_PENALTY_MEDIUM == 25
    assert constants.ABSENCE_PENALTY_HIGH == 40


def test_risk_levels_exist():
    """Verify risk level constants"""
    assert constants.RISK_SCORE_HIGH == 55
    assert constants.RISK_SCORE_CRITICAL == 75


def test_alert_settings_exist():
    """Verify alert settings"""
    assert constants.MAX_URGENT_ALERTS == 5


def test_pagination_constants_exist():
    """Verify pagination constants"""
    assert constants.DEFAULT_PAGE_SIZE == 50
    assert constants.MAX_PAGE_SIZE == 100


def test_rate_limiting_constants_exist():
    """Verify rate limiting constants"""
    assert constants.LOGIN_ATTEMPTS_LIMIT == 5
    assert constants.LOGIN_LOCKOUT_DURATION == 300


def test_cache_timeout_constants_exist():
    """Verify cache timeout constants"""
    assert constants.CACHE_TIMEOUT_DASHBOARD == 300
    assert constants.CACHE_TIMEOUT_STUDENTS == 600
    assert constants.CACHE_TIMEOUT_ATTENDANCE == 180
