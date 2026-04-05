from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import safe_decode_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse, UserResponse
from app.schemas.auth import RegisterRequest
from app.services.auth_service import AuthService
from app.utils.deps import get_current_user

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit('5/minute')
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService.register_user(db, payload.email, payload.password)


@router.post('/login', response_model=TokenResponse)
@limiter.limit('5/minute')
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')
    return AuthService.build_token_response(str(user.id))


@router.post('/refresh', response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    data = safe_decode_access_token(payload.refresh_token)
    if not data or data.get('type') != 'refresh':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    user_id = data.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token')

    return AuthService.build_token_response(user_id)


@router.get('/me', response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
