from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import decode_access_token, safe_decode_access_token
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService
from app.utils.deps import get_current_user, require_not_impersonating

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit('5/minute')
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService.register_user(db, payload.email, payload.password, payload.name)


@router.post('/login', response_model=TokenResponse)
@limiter.limit('5/minute')
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    return AuthService.build_token_response(str(user.id))


@router.post('/refresh', response_model=TokenResponse)
@limiter.limit('10/minute')
def refresh_token(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_access_token(payload.refresh_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')
    if data.get('type') != 'refresh':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token type')
    user_id = data.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    # Verify user still exists in database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User no longer exists')

    # Verify token_version hasn't been revoked
    token_version = data.get('tv', 1)
    if token_version != user.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token has been revoked')

    return AuthService.build_token_response(user_id, user.token_version)


@router.get('/me', response_model=UserResponse)
@limiter.limit('30/minute')
def get_me(request: Request, current_user: User = Depends(get_current_user)):
    return current_user


@router.put('/profile', response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AuthService.update_profile(
        db,
        current_user,
        payload.name,
        payload.avatar_url,
        payload.onboarding_completed,
    )


@router.post('/change-password', status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_not_impersonating),
):
    AuthService.change_password(db, current_user, payload.current_password, payload.new_password)


@router.post('/forgot-password', status_code=status.HTTP_200_OK)
@limiter.limit('5/minute')
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    AuthService.create_password_reset(db, payload.email)
    return {'detail': 'If that email exists, a reset link has been sent.'}


@router.post('/reset-password', status_code=status.HTTP_200_OK)
@limiter.limit('5/minute')
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    AuthService.reset_password(db, payload.token, payload.new_password)
    return {'detail': 'Password has been reset.'}


@router.post('/verify-email', status_code=status.HTTP_200_OK)
@limiter.limit('10/minute')
def verify_email(request: Request, payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    AuthService.verify_email(db, payload.token)
    return {'detail': 'Email verified successfully.'}


@router.post('/resend-verification', status_code=status.HTTP_200_OK)
@limiter.limit('3/minute')
def resend_verification(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    AuthService.resend_verification(db, current_user)
    return {'detail': 'Verification email sent.'}


@router.delete('/account', status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_not_impersonating),
):
    AuthService.delete_account(db, current_user)


@router.post('/logout', status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Revoke all tokens by incrementing token_version
    current_user.token_version += 1
    db.commit()
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token', path='/auth/refresh')

