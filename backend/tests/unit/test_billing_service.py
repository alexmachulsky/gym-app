from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.models.subscription import Subscription
from app.services.billing_service import BillingService


def _create_user(db_session, email='billing@example.com'):
    from app.services.auth_service import AuthService
    return AuthService.register_user(db_session, email, 'Password123!')


def test_get_subscription_status_free_user(db_session):
    user = _create_user(db_session)
    status = BillingService.get_subscription_status(user)
    assert status['subscription_tier'] == 'free'
    assert status['plan'] is None
    assert status['status'] is None


def test_get_subscription_status_pro_user(db_session):
    user = _create_user(db_session)
    user.subscription_tier = 'pro'
    sub = Subscription(
        user_id=user.id,
        stripe_subscription_id='sub_test_123',
        plan='pro_monthly',
        status='active',
    )
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(user)

    status = BillingService.get_subscription_status(user)
    assert status['subscription_tier'] == 'pro'
    assert status['plan'] == 'pro_monthly'
    assert status['status'] == 'active'


def test_create_checkout_invalid_plan(db_session):
    user = _create_user(db_session)
    with pytest.raises(HTTPException) as exc:
        BillingService.create_checkout_session(db_session, user, 'invalid_plan')
    assert exc.value.status_code == 400


@patch('app.services.billing_service.stripe')
def test_create_or_get_stripe_customer_new(mock_stripe, db_session):
    user = _create_user(db_session)
    mock_stripe.Customer.create.return_value = MagicMock(id='cus_test_123')

    customer_id = BillingService.create_or_get_stripe_customer(db_session, user)
    assert customer_id == 'cus_test_123'
    assert user.stripe_customer_id == 'cus_test_123'
    mock_stripe.Customer.create.assert_called_once()


@patch('app.services.billing_service.stripe')
def test_create_or_get_stripe_customer_existing(mock_stripe, db_session):
    user = _create_user(db_session)
    user.stripe_customer_id = 'cus_existing_456'
    db_session.commit()

    customer_id = BillingService.create_or_get_stripe_customer(db_session, user)
    assert customer_id == 'cus_existing_456'
    mock_stripe.Customer.create.assert_not_called()


def test_create_portal_session_no_customer(db_session):
    user = _create_user(db_session)
    with pytest.raises(HTTPException) as exc:
        BillingService.create_portal_session(db_session, user)
    assert exc.value.status_code == 400


@patch('app.services.billing_service.stripe')
def test_handle_subscription_deleted(mock_stripe, db_session):
    user = _create_user(db_session, email='cancel@example.com')
    user.stripe_customer_id = 'cus_cancel'
    user.subscription_tier = 'pro'
    sub = Subscription(
        user_id=user.id,
        stripe_subscription_id='sub_cancel_123',
        plan='pro_monthly',
        status='active',
    )
    db_session.add(sub)
    db_session.commit()

    BillingService._handle_subscription_deleted(db_session, {'id': 'sub_cancel_123'})

    db_session.refresh(user)
    db_session.refresh(sub)
    assert user.subscription_tier == 'free'
    assert sub.status == 'canceled'
