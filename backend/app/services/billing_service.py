import logging
from datetime import datetime, timezone

import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.subscription import Subscription
from app.models.user import User
from app.services.email_service import EmailService

logger = logging.getLogger('gym_tracker')

PLAN_PRICE_MAP = {
    'pro_monthly': lambda: settings.stripe_pro_monthly_price_id,
    'pro_yearly': lambda: settings.stripe_pro_yearly_price_id,
}


class BillingService:
    @staticmethod
    def _init_stripe():
        stripe.api_key = settings.stripe_secret_key

    @staticmethod
    def create_or_get_stripe_customer(db: Session, user: User) -> str:
        """Ensure the user has a Stripe customer ID, creating one if needed."""
        if user.stripe_customer_id:
            return user.stripe_customer_id

        BillingService._init_stripe()
        customer = stripe.Customer.create(
            email=user.email,
            name=user.name or '',
            metadata={'user_id': str(user.id)},
        )
        user.stripe_customer_id = customer.id
        db.commit()
        db.refresh(user)
        return customer.id

    @staticmethod
    def create_checkout_session(db: Session, user: User, plan: str) -> str:
        """Create a Stripe Checkout session and return the URL."""
        if plan not in PLAN_PRICE_MAP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Invalid plan. Must be one of: {", ".join(PLAN_PRICE_MAP.keys())}',
            )

        price_id = PLAN_PRICE_MAP[plan]()
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Stripe price not configured for this plan',
            )

        customer_id = BillingService.create_or_get_stripe_customer(db, user)

        BillingService._init_stripe()
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode='subscription',
            line_items=[{'price': price_id, 'quantity': 1}],
            success_url=f'{settings.app_url}/settings?billing=success',
            cancel_url=f'{settings.app_url}/settings?billing=canceled',
            metadata={'user_id': str(user.id), 'plan': plan},
        )
        return session.url

    @staticmethod
    def create_portal_session(db: Session, user: User) -> str:
        """Create a Stripe Customer Portal session and return the URL."""
        if not user.stripe_customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No billing account found. Subscribe to a plan first.',
            )

        BillingService._init_stripe()
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f'{settings.app_url}/settings',
        )
        return session.url

    @staticmethod
    def get_subscription_status(user: User) -> dict:
        """Return subscription status for the user."""
        sub = user.subscription
        if not sub or sub.status == 'canceled':
            return {
                'subscription_tier': user.subscription_tier,
                'plan': None,
                'status': None,
                'current_period_end': None,
                'cancel_at_period_end': False,
            }

        return {
            'subscription_tier': user.subscription_tier,
            'plan': sub.plan,
            'status': sub.status,
            'current_period_end': sub.current_period_end.isoformat() if sub.current_period_end else None,
            'cancel_at_period_end': sub.cancel_at_period_end,
        }

    # ── Webhook handlers ─────────────────────────────

    @staticmethod
    def handle_webhook_event(db: Session, payload: bytes, sig_header: str) -> None:
        """Verify and process a Stripe webhook event."""
        BillingService._init_stripe()
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret,
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid signature')
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid payload')

        event_type = event['type']
        data_obj = event['data']['object']

        handler = {
            'checkout.session.completed': BillingService._handle_checkout_completed,
            'customer.subscription.updated': BillingService._handle_subscription_updated,
            'customer.subscription.deleted': BillingService._handle_subscription_deleted,
            'invoice.payment_failed': BillingService._handle_payment_failed,
        }.get(event_type)

        if handler:
            handler(db, data_obj)

    @staticmethod
    def _handle_checkout_completed(db: Session, session_obj: dict) -> None:
        """Process a completed checkout — create/update subscription record."""
        customer_id = session_obj.get('customer')
        subscription_id = session_obj.get('subscription')
        metadata = session_obj.get('metadata', {})
        plan = metadata.get('plan', 'pro_monthly')

        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            logger.warning(f'Checkout completed for unknown customer: {customer_id}')
            return

        # Fetch the subscription from Stripe for period dates
        BillingService._init_stripe()
        stripe_sub = stripe.Subscription.retrieve(subscription_id)

        sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if sub:
            sub.stripe_subscription_id = subscription_id
            sub.plan = plan
            sub.status = stripe_sub.status
            sub.current_period_start = datetime.fromtimestamp(stripe_sub.current_period_start, tz=timezone.utc)
            sub.current_period_end = datetime.fromtimestamp(stripe_sub.current_period_end, tz=timezone.utc)
            sub.cancel_at_period_end = stripe_sub.cancel_at_period_end
        else:
            sub = Subscription(
                user_id=user.id,
                stripe_subscription_id=subscription_id,
                plan=plan,
                status=stripe_sub.status,
                current_period_start=datetime.fromtimestamp(stripe_sub.current_period_start, tz=timezone.utc),
                current_period_end=datetime.fromtimestamp(stripe_sub.current_period_end, tz=timezone.utc),
                cancel_at_period_end=stripe_sub.cancel_at_period_end,
            )
            db.add(sub)

        user.subscription_tier = 'pro'
        db.commit()

        EmailService.send_pro_welcome(user.email, user.name, plan)

    @staticmethod
    def _handle_subscription_updated(db: Session, sub_obj: dict) -> None:
        """Sync subscription state from Stripe — handles renewals, plan changes, cancellation scheduling."""
        stripe_sub_id = sub_obj.get('id')
        sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == stripe_sub_id).first()
        if not sub:
            logger.warning(f'Subscription updated for unknown subscription: {stripe_sub_id}')
            return

        sub.status = sub_obj.get('status', sub.status)
        sub.cancel_at_period_end = sub_obj.get('cancel_at_period_end', False)

        if sub_obj.get('current_period_start'):
            sub.current_period_start = datetime.fromtimestamp(sub_obj['current_period_start'], tz=timezone.utc)
        if sub_obj.get('current_period_end'):
            sub.current_period_end = datetime.fromtimestamp(sub_obj['current_period_end'], tz=timezone.utc)

        # Detect plan change from price
        items = sub_obj.get('items', {}).get('data', [])
        if items:
            price_id = items[0].get('price', {}).get('id', '')
            if price_id == settings.stripe_pro_monthly_price_id:
                sub.plan = 'pro_monthly'
            elif price_id == settings.stripe_pro_yearly_price_id:
                sub.plan = 'pro_yearly'

        user = sub.user
        if sub.status in ('active', 'trialing'):
            user.subscription_tier = 'pro'
        elif sub.status in ('past_due',):
            user.subscription_tier = 'pro'  # keep pro during grace period
        else:
            user.subscription_tier = 'free'

        db.commit()

    @staticmethod
    def _handle_subscription_deleted(db: Session, sub_obj: dict) -> None:
        """Subscription canceled / expired — downgrade user to free."""
        stripe_sub_id = sub_obj.get('id')
        sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == stripe_sub_id).first()
        if not sub:
            logger.warning(f'Subscription deleted for unknown subscription: {stripe_sub_id}')
            return

        user = sub.user
        sub.status = 'canceled'
        user.subscription_tier = 'free'
        db.commit()

        EmailService.send_subscription_cancelled(user.email, user.name)

    @staticmethod
    def _handle_payment_failed(db: Session, invoice_obj: dict) -> None:
        """Payment failed — notify the user."""
        customer_id = invoice_obj.get('customer')
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if not user:
            logger.warning(f'Payment failed for unknown customer: {customer_id}')
            return

        EmailService.send_payment_failed(user.email, user.name)
