"""
Test Coverage for core/health.py
Target: 35% → 88%
Strategy: Cover database and cache check branches
"""
import pytest
from unittest.mock import patch
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
class TestHealthCheck:
    """Cover health_check endpoint branches"""
    
    def test_health_check_all_healthy(self, client):
        """Branch: All checks pass"""
        response = client.get('/health/')
        
        assert response.status_code == 200
        assert response.data['status'] == 'healthy'
        assert response.data['checks']['database'] == 'ok'
        assert response.data['checks']['cache'] == 'ok'
        assert 'timestamp' in response.data
    
    @patch('core.health.connection.cursor')
    def test_health_check_database_failure(self, mock_cursor, client):
        """Branch: Database check fails"""
        mock_cursor.side_effect = Exception("DB connection failed")
        
        response = client.get('/health/')
        
        assert response.status_code == 503
        assert response.data['status'] == 'unhealthy'
        assert 'error' in response.data['checks']['database']
