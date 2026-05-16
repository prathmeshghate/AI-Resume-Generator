from __future__ import annotations

import json
import asyncio
from dataclasses import dataclass
from typing import Any, Dict, Optional
import os

from groq import Groq


@dataclass
class ModelConfig:
    """Configuration for ModelService.

    - base_url: retained for compatibility (unused when using Groq client)
    - model: short-name (e.g. "llama3") or full model name
    - timeout: seconds to wait for the model response
    - api_key: optional Groq API key (can also be provided via environment)
    """

    base_url: str = "http://localhost:8000"
    model: str = "llama3"
    timeout: float = 60.0
    api_key: Optional[str] = None


class ModelServiceError(RuntimeError):
    pass


class ModelService:

    def __init__(self, config: Optional[ModelConfig] = None) -> None:
        # allow a default config when none is provided (fixes the no-arg constructor)
        self.config = config or ModelConfig()

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Dict[str, Any]:
        """Generate JSON output from the configured model.

        Uses the Groq client for Llama 3.3-based models. We stream the response
        from the client, concatenate text chunks, then parse the final text as
        JSON (preserving the original behavior and error semantics).
        """

        # Map short model names to the Groq model id if necessary
        model_name = self.config.model
        if model_name == "llama3":
            model_name = "llama-3.3-70b-versatile"

        prompt = f"{system_prompt.strip()}\n\n{user_prompt.strip()}"

        def sync_request() -> str:
            try:
                # Allow explicit API key in config, else rely on env vars
                api_key = os.getenv('GROQ_API_KEY')
                client = Groq(api_key=api_key) if api_key else Groq()

                completion = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=1,
                    max_completion_tokens=1024,
                    top_p=1,
                    stream=True,
                    stop=None,
                )
                

                raw = ""
                for chunk in completion:
                    # chunk can be an object or a dict depending on client version
                    content = ""
                    try:
                        # preferred attribute access
                        delta = chunk.choices[0].delta
                        content = getattr(delta, "content", "") or ""
                    except Exception:
                        try:
                            # fallback to dict-style access
                            content = (
                                chunk.get("choices", [{}])[0]
                                .get("delta", {})
                                .get("content", "")
                            )
                        except Exception:
                            content = ""

                    raw += content

                return raw
            except Exception as exc:
                # Surface underlying client exceptions as ModelServiceError
                raise ModelServiceError(f"Error calling model backend: {exc}")

        try:
            # Run the blocking client call in a thread with a timeout
            raw_text = await asyncio.wait_for(
                asyncio.to_thread(sync_request), timeout=self.config.timeout
            )
        except asyncio.TimeoutError as exc:
            raise ModelServiceError("Model backend request timed out") from exc
        except ModelServiceError:
            raise
        except Exception as exc:
            raise ModelServiceError(f"Unexpected error calling model backend: {exc}") from exc

        raw_text = raw_text.strip()

        # Clean up potential markdown code block formatting
        if raw_text.startswith('```') and '```' in raw_text:
            lines = raw_text.split('\n')
            # Remove opening ``` line
            if lines and lines[0].strip().startswith('```'):
                lines = lines[1:]
            # Remove closing ``` line
            if lines and lines[-1].strip().startswith('```'):
                lines = lines[:-1]
            raw_text = '\n'.join(lines).strip()

        # Best-effort JSON parsing with the same error semantics as before
        try:
            print("raw text before JSON parsing:", raw_text)
            result = json.loads(raw_text)
            print(f"Parsed JSON result: {result}")
            return result
        except json.JSONDecodeError as exc:
            raise ModelServiceError(
                f"Model did not return valid JSON. Raw output was: {raw_text}"
            ) from exc


# Singleton-style accessor so routes can reuse one instance
_model_service: Optional[ModelService] = None


def get_model_service() -> ModelService:
    global _model_service
    if _model_service is None:
        _model_service = ModelService()
    return _model_service

