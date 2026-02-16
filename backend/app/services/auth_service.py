from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import TokenResponse


class AuthService:
    @staticmethod
    def register_user(db: Session, email: str, password: str) -> User:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Email already registered',
            )

        user = User(email=email, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User | None:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def build_token_response(user_id: str) -> TokenResponse:
        expires = timedelta(minutes=settings.access_token_expire_minutes)
        token = create_access_token(subject=user_id, expires_delta=expires)
        return TokenResponse(
            access_token=token,
            token_type='bearer',
            expires_in=settings.access_token_expire_minutes * 60,
        )
