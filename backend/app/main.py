import logging
import secrets
import time
import uuid

import sentry_sdk
from fastapi import FastAPI, HTTPException, Request, Security
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import APIKeyHeader
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.core.logging import setup_logging
from app.routes.achievements import router as achievements_router
from app.routes.admin import router as admin_router
from app.routes.ai import router as ai_router
from app.routes.api_v1 import router as api_v1_router
from app.routes.auth import router as auth_router
from app.routes.billing import router as billing_router
from app.routes.body_metrics import router as body_metrics_router
from app.routes.equipment_profiles import router as equipment_profiles_router
from app.routes.exercises import router as exercises_router
from app.routes.export import router as export_router
from app.routes.goals import router as goals_router
from app.routes.health import router as health_router
from app.routes.notifications import router as notifications_router
from app.routes.organizations import router as organizations_router
from app.routes.progress import router as progress_router
from app.routes.settings import router as settings_router
from app.routes.social import router as social_router
from app.routes.templates import router as templates_router
from app.routes.workouts import router as workouts_router

setup_logging(settings.log_level)
logger = logging.getLogger('gym_tracker')

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=0.3,
        profiles_sample_rate=0.3,
    )

app = FastAPI(title=settings.app_name, version='1.0.0')
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


CSRF_EXEMPT_PATHS = {
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/billing/webhook',
}


class CSRFMiddleware(BaseHTTPMiddleware):
    """Double-submit cookie CSRF protection middleware."""

    async def dispatch(self, request: Request, call_next):
        # Check CSRF token for state-changing requests
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            path = request.url.path
            # Skip CSRF check for exempt paths
            if not any(path.startswith(exempt) for exempt in CSRF_EXEMPT_PATHS):
                csrf_cookie = request.cookies.get('csrf_token')
                csrf_header = request.headers.get('X-CSRF-Token')
                if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                    return Response('CSRF token mismatch', status_code=403)

        response = await call_next(request)

        # Set CSRF cookie if not present
        if 'csrf_token' not in request.cookies:
            token = secrets.token_urlsafe(32)
            response.set_cookie(
                'csrf_token',
                token,
                httponly=False,  # Must be readable by JavaScript
                samesite='lax',
                secure=settings.cookie_secure,
                path='/',
            )

        return response


@app.middleware('http')
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response


app.add_middleware(CSRFMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_frontend_origins(),
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type', 'X-CSRF-Token'],
)

def verify_metrics_key(auth_header: str | None = Security(APIKeyHeader(name='X-Metrics-Key', auto_error=False))):
    """Verify metrics API key. Only accessible if key is configured and matches."""
    if not settings.metrics_api_key:
        # Metrics disabled (empty key)
        raise HTTPException(status_code=403, detail='Metrics endpoint is disabled')
    if auth_header != settings.metrics_api_key:
        raise HTTPException(status_code=403, detail='Invalid metrics API key')
    return True


instrumentator = Instrumentator()
instrumentator.instrument(app)

# Expose metrics with API key protection
@app.get('/metrics', include_in_schema=False, dependencies=[Security(verify_metrics_key)])
async def get_metrics():
    """Prometheus metrics endpoint. Requires X-Metrics-Key header."""
    return instrumentator.get_metrics(app)



@app.middleware('http')
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start = time.perf_counter()

    try:
        response = await call_next(request)
        # Update last_active_at for authenticated users
        auth_header = request.headers.get('authorization', '')
        if auth_header.startswith('Bearer ') and response.status_code < 400:
            try:
                from app.core.security import decode_access_token
                from app.core.database import SessionLocal
                from app.models.user import User
                import uuid as uuid_mod
                from datetime import datetime, timezone

                payload = decode_access_token(auth_header[7:])
                user_id = uuid_mod.UUID(payload.get('sub', ''))
                db = SessionLocal()
                try:
                    db.query(User).filter(User.id == user_id).update(
                        {'last_active_at': datetime.now(timezone.utc)},
                        synchronize_session=False,
                    )
                    db.commit()
                finally:
                    db.close()
            except Exception:
                pass
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            'Unhandled exception',
            extra={
                'path': request.url.path,
                'method': request.method,
                'status_code': 500,
                'duration_ms': duration_ms,
                'request_id': request_id,
            },
        )
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers['X-Request-ID'] = request_id
    logger.info(
        'Request completed',
        extra={
            'path': request.url.path,
            'method': request.method,
            'status_code': response.status_code,
            'duration_ms': duration_ms,
            'request_id': request_id,
        },
    )
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    if isinstance(exc.detail, str):
        payload = {'detail': exc.detail}
    else:
        payload = {'detail': 'Request failed'}
    return JSONResponse(status_code=exc.status_code, content=payload, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            'detail': 'Validation error',
            'error_code': 'validation_error',
            'fields': exc.errors(),
        },
    )


@app.on_event('startup')
async def on_startup():
    logger.info('Application startup')
    if settings.secret_key == 'change-me-in-production':
        raise RuntimeError(
            'SECRET_KEY is set to the default insecure value. '
            'Set a strong SECRET_KEY in your environment before starting.'
        )


@app.on_event('shutdown')
async def on_shutdown():
    logger.info('Application shutdown')


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(billing_router)
app.include_router(exercises_router)
app.include_router(workouts_router)
app.include_router(body_metrics_router)
app.include_router(progress_router)
app.include_router(templates_router)
app.include_router(settings_router)
app.include_router(goals_router)
app.include_router(export_router)
app.include_router(equipment_profiles_router)
app.include_router(ai_router)
app.include_router(admin_router)
app.include_router(achievements_router)
app.include_router(notifications_router)
app.include_router(social_router)
app.include_router(api_v1_router)
app.include_router(organizations_router)
