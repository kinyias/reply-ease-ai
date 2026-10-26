import pytest
from unittest.mock import MagicMock, patch

from app.core.config import Settings
from app.services.gemini_service import (
    GeminiAllModelsFailedError,
    generate_content_with_fallback,
    generate_content_with_fallback_sync,
)


def test_gemini_config_fallback_order():
    settings = Settings(
        GEMINI_MODEL="gemini-1.5-flash",
        GEMINI_FALLBACK_MODELS="gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-2.5-flash,gemini-3-flash,gemini-3.6-flash",
    )
    assert settings.GEMINI_FALLBACK_MODELS == [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-3-flash",
        "gemini-3.6-flash",
    ]
    assert settings.gemini_models_with_fallback == [
        "gemini-1.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-3-flash",
        "gemini-3.6-flash",
    ]


@pytest.mark.asyncio
async def test_generate_content_with_fallback_success_on_fallback():
    attempted_models = []

    def mock_generative_model(model_name, **kwargs):
        attempted_models.append(model_name)
        mock_instance = MagicMock()

        async def mock_generate_content_async(*args, **call_kwargs):
            # Fail on primary model gemini-1.5-flash
            if model_name == "gemini-1.5-flash":
                raise Exception("ResourceExhausted 429 Quota Exceeded")
            # Succeed on the first fallback: gemini-3.1-flash-lite
            mock_resp = MagicMock()
            mock_resp.text = f"Success from {model_name}"
            return mock_resp

        mock_instance.generate_content_async = mock_generate_content_async
        return mock_instance

    with patch("google.generativeai.GenerativeModel", side_effect=mock_generative_model):
        response = await generate_content_with_fallback("Hello")
        assert response.text == "Success from gemini-3.1-flash-lite"
        # Primary failed, first fallback succeeded
        assert attempted_models == ["gemini-1.5-flash", "gemini-3.1-flash-lite"]


@pytest.mark.asyncio
async def test_generate_content_with_fallback_full_chain():
    attempted_models = []

    def mock_generative_model(model_name, **kwargs):
        attempted_models.append(model_name)
        mock_instance = MagicMock()

        async def mock_generate_content_async(*args, **call_kwargs):
            # Fail until the 5th model: gemini-3-flash
            if model_name != "gemini-3-flash":
                raise Exception(f"Model {model_name} failed")
            mock_resp = MagicMock()
            mock_resp.text = f"Success from {model_name}"
            return mock_resp

        mock_instance.generate_content_async = mock_generate_content_async
        return mock_instance

    with patch("google.generativeai.GenerativeModel", side_effect=mock_generative_model):
        response = await generate_content_with_fallback("Hello")
        assert response.text == "Success from gemini-3-flash"
        assert attempted_models == [
            "gemini-1.5-flash",
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-3-flash",
        ]


@pytest.mark.asyncio
async def test_generate_content_with_fallback_all_fail():
    def mock_generative_model(model_name, **kwargs):
        mock_instance = MagicMock()

        async def mock_generate_content_async(*args, **call_kwargs):
            raise Exception(f"Unavailable {model_name}")

        mock_instance.generate_content_async = mock_generate_content_async
        return mock_instance

    with patch("google.generativeai.GenerativeModel", side_effect=mock_generative_model):
        with pytest.raises(GeminiAllModelsFailedError) as exc_info:
            await generate_content_with_fallback("Hello")
        assert "All Gemini models failed" in str(exc_info.value)
