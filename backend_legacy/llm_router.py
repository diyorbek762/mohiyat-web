"""
Mohiyat AI — LLM Abstraction Router
=====================================
MVP: Routes to Gemini Flash (freemium) or Gemini Pro (premium).
The router is designed for easy extension with fallback providers.
"""

import logging
import time
from enum import Enum
from google import genai
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMTier(str, Enum):
    FREEMIUM = "freemium"
    PREMIUM = "premium"


class LLMRouter:
    """Intelligent LLM routing with tiered model selection."""

    def __init__(self):
        self.gemini_client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    def _get_model_for_tier(self, tier: LLMTier) -> str:
        if tier == LLMTier.PREMIUM:
            return settings.MODEL_PREMIUM
        return settings.MODEL_FREEMIUM

    async def route(
        self,
        prompt: str,
        system_instruction: str,
        tier: LLMTier = LLMTier.FREEMIUM,
    ) -> dict:
        """
        Route to the best LLM for the given tier.
        Returns: {model_used, response_text, processing_ms}
        """
        model = self._get_model_for_tier(tier)
        start = time.time()

        try:
            full_prompt = f"{system_instruction}\n\n---\n\n{prompt}"
            response = self.gemini_client.models.generate_content(
                model=model,
                contents=full_prompt,
            )
            elapsed = int((time.time() - start) * 1000)
            return {
                "model_used": model,
                "response_text": response.text,
                "processing_ms": elapsed,
            }
        except Exception as e:
            logger.error(f"Gemini ({model}) failed: {e}")
            raise RuntimeError(f"LLM provider unavailable: {e}")
