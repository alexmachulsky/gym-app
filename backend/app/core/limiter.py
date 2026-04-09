from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import safe_decode_access_token


def get_rate_limit_key(request: Request) -> str:
    """
    Extract user ID from JWT token for rate limiting.
    Falls back to IP address if not authenticated.
    """
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else ''

    if not token:
        # Try cookie as fallback
        token = request.cookies.get('access_token', '')

    if token:
        payload = safe_decode_access_token(token)
        if payload and payload.get('sub'):
            return f"user:{payload['sub']}"

    return get_remote_address(request)


limiter = Limiter(key_func=get_rate_limit_key)
