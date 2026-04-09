import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.email_verification import EmailVerificationToken
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.services.email_service import EmailService

logger = logging.getLogger('gym_tracker')


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    @staticmethod
    def register_user(db: Session, email: str, password: str, name: str | None = None) -> User:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Email already registered',
            )

        trial_ends_at = datetime.now(timezone.utc) + timedelta(days=settings.trial_days)
        user = User(
            email=email,
            password_hash=hash_password(password),
            name=name,
            trial_ends_at=trial_ends_at,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Send verification email (fire-and-forget)
        AuthService._create_and_send_verification(db, user)
        EmailService.send_trial_started_email(email, name)

        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User | None:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None

        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Account temporarily locked due to too many failed login attempts. Try again later.',
            )

        if not verify_password(password, user.password_hash):
            # Increment failed attempts
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
                logger.warning('Account locked due to failed login attempts: %s', email)
            db.commit()
            return None

        # Successful login — reset lockout state
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()
        return user

    @staticmethod
    def build_token_response(user_id: str, token_version: int = 1) -> TokenResponse:
        expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(subject=user_id, expires_delta=expires, token_version=token_version)
        refresh_token = create_refresh_token(subject=user_id, token_version=token_version)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type='bearer',
            expires_in=settings.access_token_expire_minutes * 60,
        )

    # ── profile ──────────────────────────────────────

    @staticmethod
    def update_profile(
        db: Session,
        user: User,
        name: str | None,
        avatar_url: str | None,
        onboarding_completed: bool | None = None,
    ) -> User:
        if name is not None:
            user.name = name
        if avatar_url is not None:
            user.avatar_url = avatar_url
        if onboarding_completed is not None:
            user.onboarding_completed = onboarding_completed
        db.commit()
        db.refresh(user)
        return user

    # ── password change ──────────────────────────────

    @staticmethod
    def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Current password is incorrect')
        user.password_hash = hash_password(new_password)
        user.token_version += 1
        db.commit()

    # ── forgot / reset password ──────────────────────

    @staticmethod
    def create_password_reset(db: Session, email: str) -> None:
        """Always returns None (prevents email enumeration). Sends reset email if user exists."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return

        # Invalidate previous tokens
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,  # noqa: E712
        ).update({'used': True})

        token = secrets.token_urlsafe(48)
        reset = PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(reset)
        db.commit()

        EmailService.send_password_reset_email(user.email, user.name, token)

    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> None:
        token_hash = _hash_token(token)
        reset = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,  # noqa: E712
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        ).first()

        if not reset:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired reset token')

        user = db.query(User).filter(User.id == reset.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired reset token')

        user.password_hash = hash_password(new_password)
        user.token_version += 1
        reset.used = True
        db.commit()

    # ── email verification ───────────────────────────

    @staticmethod
    def _create_and_send_verification(db: Session, user: User) -> None:
        token = secrets.token_urlsafe(48)
        verification = EmailVerificationToken(
            user_id=user.id,
            token_hash=_hash_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        db.add(verification)
        db.commit()

        EmailService.send_verification_email(user.email, user.name, token)

    @staticmethod
    def verify_email(db: Session, token: str) -> None:
        token_hash = _hash_token(token)
        verification = db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used == False,  # noqa: E712
            EmailVerificationToken.expires_at > datetime.now(timezone.utc),
        ).first()

        if not verification:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired verification token')

        user = db.query(User).filter(User.id == verification.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired verification token')

        user.email_verified = True
        verification.used = True
        db.commit()

        EmailService.send_welcome_email(user.email, user.name)

    @staticmethod
    def resend_verification(db: Session, user: User) -> None:
        if user.email_verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already verified')

        # Invalidate old tokens
        db.query(EmailVerificationToken).filter(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used == False,  # noqa: E712
        ).update({'used': True})
        db.commit()

        AuthService._create_and_send_verification(db, user)

    # ── account deletion (GDPR) ──────────────────────

    @staticmethod
    def delete_account(db: Session, user: User) -> None:
        db.delete(user)
        db.commit()
