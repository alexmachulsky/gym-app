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
