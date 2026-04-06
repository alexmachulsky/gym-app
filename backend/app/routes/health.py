from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(tags=['health'])


@router.get('/health')
def health(db: Session = Depends(get_db)):
    db.execute(text('SELECT 1'))
    return {'status': 'ok', 'service': 'backend', 'version': '1.0.0'}


@router.get('/health/ready')
def readiness(db: Session = Depends(get_db)):
    """Deep health check for Kubernetes readiness probes."""
    checks = {'database': 'ok'}
    try:
        db.execute(text('SELECT 1'))
    except Exception:
        checks['database'] = 'error'

    overall = 'ok' if all(v == 'ok' for v in checks.values()) else 'degraded'
    return {'status': overall, 'checks': checks}
