from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from backend.schemas import AgentExplanation

_DEFAULT_RECOMMENDATIONS = [
    "Reassess weather minima and personal limits.",
    "Coordinate with an instructor or safety pilot before launch.",
    "Prepare alternates and contingency fuel reserves.",
]


def try_parse_agent_output(value: Any) -> AgentExplanation | None:
    if value is None:
        return None
    if isinstance(value, AgentExplanation):
        return value
    if isinstance(value, dict):
        try:
            return AgentExplanation.model_validate(value)
        except ValidationError:
            return None
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            return AgentExplanation.model_validate_json(stripped)
        except ValidationError:
            try:
                return AgentExplanation.model_validate(json.loads(stripped))
            except (json.JSONDecodeError, ValidationError):
                return None
    return None


def coerce_agent_result(result: Any) -> AgentExplanation:
    parsed = try_parse_agent_output(getattr(result, "data", None))
    if parsed:
        return parsed

    raw_text = getattr(result, "text", None)
    if raw_text is None:
        raw_text = getattr(result, "raw", None)
    if raw_text is None:
        raw_text = getattr(result, "content", None)
    if raw_text is None and getattr(result, "data", None) is not None:
        raw_text = result.data
    if raw_text is None:
        raw_text = str(result)

    parsed = try_parse_agent_output(raw_text)
    if parsed:
        return parsed

    return AgentExplanation(
        explanation=str(raw_text),
        recommendations=_DEFAULT_RECOMMENDATIONS,
        telemetry_findings=None,
    )
