"""
Test Coverage for core/replay_protection.py
Target: 56% → 100%
Strategy: Cover replay detection, expiration, and exception branches
"""
import pytest
import time
from unittest.mock import patch, MagicMock
from django.test import RequestFactory
from core.replay_protection import ReplayAttackProtectionMiddleware


@pytest.fixture
def middleware():
    get_response = MagicMock(return_value=MagicMock(status_code=200))
    return ReplayAttackProtectionMiddleware(get_response)


@pytest.fixture
def factory():
    return RequestFactory()


class TestReplayAttackProtection:
    """Cover ReplayAttackProtectionMiddleware branches"""
    
    def test_get_request_passes_through(self, middleware, factory):
        """Branch: GET requests skip replay check"""
        request = factory.get('/api/test/')
        response = middleware(request)
        assert response.status_code == 200
    
    def test_post_without_nonce_passes_through(self, middleware, factory):
        """Branch: POST without nonce/timestamp skips check"""
        request = factory.post('/api/test/')
        response = middleware(request)
        assert response.status_code == 200
    
    def test_post_with_valid_nonce_succeeds(self, middleware, factory):
        """Branch: Valid nonce and timestamp"""
        request = factory.post(
            '/api/test/',
            HTTP_X_REQUEST_NONCE='unique-nonce-123',
            HTTP_X_REQUEST_TIMESTAMP=str(time.time())
        )
        response = middleware(request)
        assert response.status_code == 200
    
    def test_expired_request_rejected(self, middleware, factory):
        """Branch: current_time - request_time > 300"""
        old_timestamp = time.time() - 400  # 400 seconds ago
        request = factory.post(
            '/api/test/',
            HTTP_X_REQUEST_NONCE='nonce-456',
            HTTP_X_REQUEST_TIMESTAMP=str(old_timestamp)
        )
        response = middleware(request)
        assert response.status_code == 400
        assert b'expired' in response.content.lower()
    
    @patch('core.replay_protection.cache.get')
    def test_duplicate_nonce_rejected(self, mock_cache_get, middleware, factory):
        """Branch: if cache.get(cache_key) (replay detected)"""
        mock_cache_get.return_value = True
        
        request = factory.post(
            '/api/test/',
            HTTP_X_REQUEST_NONCE='duplicate-nonce',
            HTTP_X_REQUEST_TIMESTAMP=str(time.time())
        )
        response = middleware(request)
        assert response.status_code == 409
        assert b'duplicate' in response.content.lower()
    
    def test_invalid_timestamp_format_passes_through(self, middleware, factory):
        """Branch: except (ValueError, TypeError)"""
        request = factory.post(
            '/api/test/',
            HTTP_X_REQUEST_NONCE='nonce-789',
            HTTP_X_REQUEST_TIMESTAMP='invalid-timestamp'
        )
        response = middleware(request)
        assert response.status_code == 200  # Continues without replay protection
    
    def test_put_request_checked(self, middleware, factory):
        """Branch: PUT in state-changing methods"""
        request = factory.put(
            '/api/test/',
            HTTP_X_REQUEST_NONCE='put-nonce',
            HTTP_X_REQUEST_TIMESTAMP=str(time.time())
        )
        response = middleware(request)
        assert response.status_code == 200
    
    def test_patch_request_checked(self, middleware, factory):
        """Branch: PATCH in state-changing methods"""
        request = factory.patch(
            '/api/test/',
            HTTP_X_REQUEST_NONCE='patch-nonce',
            HTTP_X_REQUEST_TIMESTAMP=str(time.time())
        )
        response = middleware(request)
        assert response.status_code == 200
    
    def test_delete_request_checked(self, middleware, factory):
        """Branch: DELETE in state-changing methods"""
        request = factory.delete(
            '/api/test/',
            HTTP_X_REQUEST_NONCE='delete-nonce',
            HTTP_X_REQUEST_TIMESTAMP=str(time.time())
        )
        response = middleware(request)
        assert response.status_code == 200
