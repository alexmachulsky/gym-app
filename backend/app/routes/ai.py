from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.services.ai_service import AIService
from app.utils.deps import require_pro

router = APIRouter(prefix='/ai', tags=['ai'])


# ── Request / Response schemas ─────────────────────────────

class ChatRequest(BaseModel):
    message: str
    style: str = 'balanced'
    context: str = ''

    @field_validator('message')
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()

    @field_validator('style')
    @classmethod
    def valid_style(cls, v: str) -> str:
        if v not in ('motivational', 'balanced', 'tough'):
            raise ValueError('Style must be motivational, balanced, or tough')
        return v


class ChatResponse(BaseModel):
    reply: str


class ParseRequest(BaseModel):
    text: str

    @field_validator('text')
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Text cannot be empty')
        return v.strip()


class ParseResponse(BaseModel):
    exercises: list[dict]


class SummaryRequest(BaseModel):
    workout_data: str

    @field_validator('workout_data')
    @classmethod
    def data_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Workout data cannot be empty')
        return v.strip()


class TipsRequest(BaseModel):
    exercise_name: str

    @field_validator('exercise_name')
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Exercise name cannot be empty')
        return v.strip()


class StatusResponse(BaseModel):
    available: bool
    model: str | None = None


# ── Endpoints ──────────────────────────────────────────────

@router.get('/status', response_model=StatusResponse)
@limiter.limit('10/minute')
def ai_status(request: Request, current_user: User = Depends(require_pro)):
    """Check whether the AI backend is configured and available."""
    if AIService.is_available():
        from app.core.config import settings
        return StatusResponse(available=True, model=settings.groq_model)
    return StatusResponse(available=False)


@router.post('/chat', response_model=ChatResponse)
@limiter.limit('10/minute')
async def ai_chat(
    request: Request,
    body: ChatRequest,
    current_user: User = Depends(require_pro),
):
    """General coaching chat — exercise Q&A, form tips, motivation."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail='AI service is not configured')
    reply = await AIService.coach_chat(body.message, body.style, body.context)
    if reply is None:
        raise HTTPException(status_code=502, detail='AI service unavailable — try again later')
    return ChatResponse(reply=reply)


@router.post('/parse-workout', response_model=ParseResponse)
@limiter.limit('10/minute')
async def ai_parse_workout(
    request: Request,
    body: ParseRequest,
    current_user: User = Depends(require_pro),
):
    """Parse freeform workout text into structured exercise data using AI."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail='AI service is not configured')
    exercises = await AIService.parse_workout_text(body.text)
    if exercises is None:
        raise HTTPException(status_code=502, detail='AI could not parse the workout text')
    return ParseResponse(exercises=exercises)


@router.post('/workout-summary', response_model=ChatResponse)
@limiter.limit('10/minute')
async def ai_workout_summary(
    request: Request,
    body: SummaryRequest,
    current_user: User = Depends(require_pro),
):
    """Generate a motivating text summary of workout performance."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail='AI service is not configured')
    summary = await AIService.workout_summary(body.workout_data)
    if summary is None:
        raise HTTPException(status_code=502, detail='AI service unavailable')
    return ChatResponse(reply=summary)


@router.post('/exercise-tips', response_model=ChatResponse)
@limiter.limit('10/minute')
async def ai_exercise_tips(
    request: Request,
    body: TipsRequest,
    current_user: User = Depends(require_pro),
):
    """Get form tips, common mistakes, and variations for an exercise."""
    if not AIService.is_available():
        raise HTTPException(status_code=503, detail='AI service is not configured')
    tips = await AIService.exercise_tips(body.exercise_name)
    if tips is None:
        raise HTTPException(status_code=502, detail='AI service unavailable')
    return ChatResponse(reply=tips)
