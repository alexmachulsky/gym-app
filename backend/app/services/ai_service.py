"""AI service using Groq's OpenAI-compatible API for workout coaching features."""
from __future__ import annotations

import json
import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger('gym_tracker')

GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

SYSTEM_PROMPTS = {
    'coach': (
        'You are SmartGym AI Coach — a knowledgeable, encouraging fitness assistant. '
        'Give concise, evidence-based advice. Use metric units by default. '
        'Never diagnose injuries or replace medical advice. '
        'Keep responses under 300 words unless the user asks for detail.'
    ),
    'parser': (
        'You are a workout text parser. Given raw text describing a workout routine, '
        'extract exercises and return ONLY a JSON array. Each element must have: '
        '"name" (string), "sets" (integer), "reps" (integer), "weight" (number or null). '
        'If a field is unclear, use a sensible default (3 sets, 10 reps, null weight). '
        'Return ONLY valid JSON, no markdown, no explanation.'
    ),
    'summary': (
        'You are a fitness analytics assistant. Given workout data, produce a concise, '
        'motivating performance summary highlighting trends, PRs, and areas to improve. '
        'Use bullet points. Keep it under 200 words.'
    ),
}

COACHING_STYLE = {
    'motivational': 'Be enthusiastic and encouraging. Celebrate wins big and small.',
    'balanced': 'Be supportive but objective. Mix encouragement with practical tips.',
    'tough': 'Be direct and no-nonsense. Push the user to do better. No sugar-coating.',
}


class AIService:
    """Handles all LLM interactions through Groq API."""

    @staticmethod
    def is_available() -> bool:
        return bool(settings.groq_api_key)

    @staticmethod
    async def _call_llm(
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Optional[str]:
        if not settings.groq_api_key:
            return None

        headers = {
            'Authorization': f'Bearer {settings.groq_api_key}',
            'Content-Type': 'application/json',
        }
        payload = {
            'model': settings.groq_model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message},
            ],
            'temperature': temperature,
            'max_tokens': max_tokens,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(GROQ_BASE_URL, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                return data['choices'][0]['message']['content']
            except httpx.HTTPStatusError as exc:
                logger.error('Groq API error: %s %s', exc.response.status_code, exc.response.text[:200])
                return None
            except Exception as exc:
                logger.error('Groq API call failed: %s', exc)
                return None

    @staticmethod
    async def parse_workout_text(raw_text: str) -> Optional[list[dict]]:
        """Parse freeform workout text into structured exercise data."""
        result = await AIService._call_llm(
            system_prompt=SYSTEM_PROMPTS['parser'],
            user_message=raw_text,
            temperature=0.1,
            max_tokens=2048,
        )
        if not result:
            return None
        # Strip markdown code fences if the model adds them
        cleaned = result.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('\n', 1)[-1]
        if cleaned.endswith('```'):
            cleaned = cleaned.rsplit('```', 1)[0]
        cleaned = cleaned.strip()
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            logger.warning('AI returned invalid JSON for workout parse: %s', cleaned[:200])
        return None

    @staticmethod
    async def coach_chat(
        user_message: str,
        style: str = 'balanced',
        context: str = '',
    ) -> Optional[str]:
        """General coaching chat — exercise Q&A, form tips, nutrition advice."""
        style_instruction = COACHING_STYLE.get(style, COACHING_STYLE['balanced'])
        system = f"{SYSTEM_PROMPTS['coach']}\n\nCoaching style: {style_instruction}"
        if context:
            system += f"\n\nUser context: {context}"
        return await AIService._call_llm(system, user_message)

    @staticmethod
    async def workout_summary(workout_data: str) -> Optional[str]:
        """Generate a text summary of recent workout performance."""
        return await AIService._call_llm(
            system_prompt=SYSTEM_PROMPTS['summary'],
            user_message=workout_data,
            temperature=0.5,
        )

    @staticmethod
    async def exercise_tips(exercise_name: str) -> Optional[str]:
        """Get form tips and variations for a specific exercise."""
        prompt = (
            f"Give me concise form tips, common mistakes, and 2-3 variations "
            f"for the exercise: {exercise_name}"
        )
        return await AIService._call_llm(SYSTEM_PROMPTS['coach'], prompt, temperature=0.5)
