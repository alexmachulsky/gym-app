import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.billing import (
    BillingConfigResponse,
    BillingStatusResponse,
    CheckoutRequest,
    CheckoutResponse,
    PortalResponse,
)
from app.services.billing_service import BillingService
from app.utils.deps import get_current_user, get_user_limits, require_not_impersonating

logger = logging.getLogger('gym_tracker')

router = APIRouter(prefix='/billing', tags=['billing'])


@router.get('/config', response_model=BillingConfigResponse)
def get_billing_config():
    return BillingConfigResponse(
        publishable_key=settings.stripe_publishable_key,
        pro_monthly_price_id=settings.stripe_pro_monthly_price_id,
        pro_yearly_price_id=settings.stripe_pro_yearly_price_id,
    )


@router.get('/status', response_model=BillingStatusResponse)
def get_billing_status(current_user: User = Depends(get_current_user)):
    return BillingService.get_subscription_status(current_user)


@router.get('/limits')
def get_billing_limits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_limits(db, current_user)


@router.post('/checkout', response_model=CheckoutResponse)
@limiter.limit('5/minute')
def create_checkout(
    request: Request,
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_not_impersonating),
):
    url = BillingService.create_checkout_session(
        db, current_user, payload.plan, payload.promotion_code,
    )
    return CheckoutResponse(checkout_url=url)


@router.post('/portal', response_model=PortalResponse)
@limiter.limit('5/minute')
def create_portal(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_not_impersonating),
):
    url = BillingService.create_portal_session(db, current_user)
    return PortalResponse(portal_url=url)


@router.post('/webhook')
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    if not sig_header:
        raise HTTPException(status_code=400, detail='Missing stripe-signature header')
    try:
        BillingService.handle_webhook_event(db, payload, sig_header)
    except HTTPException:
        # Re-raise authentication/validation errors
        raise
    except Exception as e:
        logger.error(f'Webhook processing failed: {str(e)}', exc_info=True)
        # Return 200 to prevent Stripe retries for transient errors
    return {'status': 'ok'}


class CouponCheckRequest(BaseModel):
    code: str


class CancelFeedbackRequest(BaseModel):
    reason: str
    feedback: str | None = None


@router.post('/coupon/validate')
def validate_coupon(
    payload: CouponCheckRequest,
    current_user: User = Depends(get_current_user),
):
    return BillingService.validate_coupon(payload.code)


@router.post('/cancel-feedback')
def submit_cancel_feedback(
    payload: CancelFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BillingService.record_cancel_feedback(
        db, current_user, payload.reason, payload.feedback,
    )
