import logging
from typing import Any, Dict, List, Optional, Union
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiServiceError(Exception):
    """Base exception for Gemini service errors."""
    pass


class GeminiAllModelsFailedError(GeminiServiceError):
    """Raised when all candidate Gemini models (primary + fallbacks) fail."""

    def __init__(self, errors: Dict[str, Exception]):
        self.errors = errors
        summary = "; ".join(f"[{model}]: {str(err)}" for model, err in errors.items())
        super().__init__(f"All Gemini models failed. Errors: {summary}")


def init_gemini() -> None:
    """Initialize Google Generative AI configuration."""
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    else:
        logger.warning("GEMINI_API_KEY is not set. Gemini API calls will fail.")


async def generate_content_with_fallback(
    contents: Union[str, List[Any]],
    system_instruction: Optional[str] = None,
    generation_config: Optional[Union[Dict[str, Any], GenerationConfig]] = None,
    safety_settings: Optional[Any] = None,
) -> Any:
    """
    Generate content with Gemini, automatically falling back to secondary models
    if the primary model fails (e.g. rate limit, quota, model unavailable, deprecated).

    Fallback order is controlled by settings.gemini_models_with_fallback:
    GEMINI_MODEL -> gemini-3.1-flash-lite -> gemini-3.5-flash-lite ->
    gemini-2.5-flash -> gemini-3-flash -> gemini-3.6-flash
    """
    init_gemini()
    candidate_models = settings.gemini_models_with_fallback
    errors: Dict[str, Exception] = {}

    for idx, model_name in enumerate(candidate_models):
        try:
            logger.debug(
                "Attempting Gemini generation with model '%s' (attempt %d/%d)...",
                model_name,
                idx + 1,
                len(candidate_models),
            )

            kwargs: Dict[str, Any] = {"model_name": model_name}
            if system_instruction:
                kwargs["system_instruction"] = system_instruction

            model = genai.GenerativeModel(**kwargs)
            response = await model.generate_content_async(
                contents=contents,
                generation_config=generation_config,
                safety_settings=safety_settings,
            )

            if idx > 0:
                logger.info(
                    "Fallback successful! Generated content using model '%s' (fallback #%d).",
                    model_name,
                    idx,
                )
            return response

        except Exception as exc:
            logger.warning(
                "Gemini model '%s' failed (error: %s: %s). Falling back to next model...",
                model_name,
                type(exc).__name__,
                exc,
            )
            errors[model_name] = exc

    # If all models failed
    logger.error("All Gemini models failed: %s", errors)
    raise GeminiAllModelsFailedError(errors)


def generate_content_with_fallback_sync(
    contents: Union[str, List[Any]],
    system_instruction: Optional[str] = None,
    generation_config: Optional[Union[Dict[str, Any], GenerationConfig]] = None,
    safety_settings: Optional[Any] = None,
) -> Any:
    """
    Synchronous version of generate_content_with_fallback.
    """
    init_gemini()
    candidate_models = settings.gemini_models_with_fallback
    errors: Dict[str, Exception] = {}

    for idx, model_name in enumerate(candidate_models):
        try:
            kwargs: Dict[str, Any] = {"model_name": model_name}
            if system_instruction:
                kwargs["system_instruction"] = system_instruction

            model = genai.GenerativeModel(**kwargs)
            response = model.generate_content(
                contents=contents,
                generation_config=generation_config,
                safety_settings=safety_settings,
            )

            if idx > 0:
                logger.info(
                    "Fallback successful! Generated content using model '%s' (fallback #%d).",
                    model_name,
                    idx,
                )
            return response

        except Exception as exc:
            logger.warning(
                "Gemini model '%s' failed (error: %s: %s). Falling back to next model...",
                model_name,
                type(exc).__name__,
                exc,
            )
            errors[model_name] = exc

    logger.error("All Gemini models failed: %s", errors)
    raise GeminiAllModelsFailedError(errors)
