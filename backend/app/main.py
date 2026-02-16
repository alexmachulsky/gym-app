import logging
import time
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging
from app.routes.auth import router as auth_router
from app.routes.body_metrics import router as body_metrics_router
from app.routes.exercises import router as exercises_router
from app.routes.health import router as health_router
from app.routes.progress import router as progress_router
from app.routes.workouts import router as workouts_router

setup_logging(settings.log_level)
logger = logging.getLogger('gym_tracker')

app = FastAPI(title=settings.app_name, version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_frontend_origins(),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start = time.perf_counter()

    try:
        response = await call_next(request)
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


@app.on_event('shutdown')
async def on_shutdown():
    logger.info('Application shutdown')


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(exercises_router)
app.include_router(workouts_router)
app.include_router(body_metrics_router)
app.include_router(progress_router)
