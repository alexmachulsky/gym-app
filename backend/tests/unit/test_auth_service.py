import pytest
from fastapi import HTTPException

from app.core.security import decode_access_token, verify_password
from app.services.auth_service import AuthService


def test_register_hashes_password(db_session):
    user = AuthService.register_user(db_session, 'alice@example.com', 'Password123!')
    assert user.email == 'alice@example.com'
    assert user.password_hash != 'Password123!'
    assert verify_password('Password123!', user.password_hash)


def test_register_duplicate_email_conflict(db_session):
    AuthService.register_user(db_session, 'dupe@example.com', 'Password123!')
    with pytest.raises(HTTPException) as exc:
        AuthService.register_user(db_session, 'dupe@example.com', 'Password123!')
    assert exc.value.status_code == 409


def test_authenticate_success_and_failure(db_session):
    AuthService.register_user(db_session, 'bob@example.com', 'Password123!')

    assert AuthService.authenticate_user(db_session, 'bob@example.com', 'Password123!') is not None
    assert AuthService.authenticate_user(db_session, 'bob@example.com', 'WrongPassword123!') is None
    assert AuthService.authenticate_user(db_session, 'notfound@example.com', 'Password123!') is None


def test_jwt_create_and_decode(db_session):
    user = AuthService.register_user(db_session, 'jwt@example.com', 'Password123!')
    token_response = AuthService.build_token_response(str(user.id))
    payload = decode_access_token(token_response.access_token)

    assert payload['sub'] == str(user.id)
    assert 'exp' in payload
    assert token_response.token_type == 'bearer'
    assert token_response.expires_in > 0


def test_register_with_name(db_session):
    user = AuthService.register_user(db_session, 'named@example.com', 'Password123!', name='Alice')
    assert user.name == 'Alice'


def test_register_without_name(db_session):
    user = AuthService.register_user(db_session, 'noname@example.com', 'Password123!')
    assert user.name is None


def test_update_profile(db_session):
    user = AuthService.register_user(db_session, 'prof@example.com', 'Password123!')
    updated = AuthService.update_profile(db_session, user, name='New Name', avatar_url=None)
    assert updated.name == 'New Name'
    assert updated.avatar_url is None

    updated2 = AuthService.update_profile(db_session, user, name=None, avatar_url='https://example.com/pic.jpg')
    assert updated2.name == 'New Name'  # unchanged
    assert updated2.avatar_url == 'https://example.com/pic.jpg'


def test_change_password_success(db_session):
    user = AuthService.register_user(db_session, 'chg@example.com', 'Password123!')
    AuthService.change_password(db_session, user, 'Password123!', 'NewPassword456!')
    assert verify_password('NewPassword456!', user.password_hash)


def test_change_password_wrong_current(db_session):
    user = AuthService.register_user(db_session, 'chg2@example.com', 'Password123!')
    with pytest.raises(HTTPException) as exc:
        AuthService.change_password(db_session, user, 'WrongPassword!1', 'NewPassword456!')
    assert exc.value.status_code == 400


def test_password_reset_flow(db_session):
    user = AuthService.register_user(db_session, 'reset@example.com', 'Password123!')

    # create_password_reset should not raise for existing user
    AuthService.create_password_reset(db_session, user.email)

    # Should not raise for non-existent user (anti-enumeration)
    AuthService.create_password_reset(db_session, 'nonexistent@example.com')

    # Get the token from DB to simulate the email link
    from app.models.password_reset import PasswordResetToken
    reset_record = db_session.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,  # noqa: E712
    ).first()
    assert reset_record is not None

    # We can't easily reverse the hash, so we test reset_password with invalid token
    with pytest.raises(HTTPException) as exc:
        AuthService.reset_password(db_session, 'invalid-token', 'NewPassword456!')
    assert exc.value.status_code == 400


def test_email_verification_resend(db_session):
    user = AuthService.register_user(db_session, 'verify@example.com', 'Password123!')
    assert user.email_verified is False

    # Resend should work when not verified
    AuthService.resend_verification(db_session, user)

    # Manually mark as verified
    user.email_verified = True
    db_session.commit()

    # Resend should fail when already verified
    with pytest.raises(HTTPException) as exc:
        AuthService.resend_verification(db_session, user)
    assert exc.value.status_code == 400


def test_verify_email_invalid_token(db_session):
    with pytest.raises(HTTPException) as exc:
        AuthService.verify_email(db_session, 'bad-token')
    assert exc.value.status_code == 400


def test_delete_account(db_session):
    user = AuthService.register_user(db_session, 'delete@example.com', 'Password123!')
    user_id = user.id
    AuthService.delete_account(db_session, user)

    from app.models.user import User
    assert db_session.query(User).filter(User.id == user_id).first() is None
