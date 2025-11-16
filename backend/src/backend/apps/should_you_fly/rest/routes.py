from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from backend.schemas import AgentPreference, FlightContext, FlightEvaluation
from backend.services import (
    RECENT_EVALUATIONS,
    compute_risk,
    generate_agent_explanation,
)

router = APIRouter(prefix="/api/should-you-fly", tags=["should-you-fly"])


@router.post("/evaluate", response_model=FlightEvaluation)
async def evaluate_flight(
    context: FlightContext,
    agent_source: AgentPreference = Query(
        "auto",
        description="auto → prefer You.com then Gemini; or force a provider.",
    ),
) -> FlightEvaluation:
    """
    Run the deterministic risk engine plus the AI explanation layer.
    """

    risk = compute_risk(context)
    try:
        explanation = await generate_agent_explanation(context, risk, agent_source)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # pragma: no cover - defensive guardrail
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI explanation.",
        ) from exc

    return FlightEvaluation(risk=risk, explanation=explanation)


@router.get("/history")
async def get_recent_history() -> list[dict[str, str | int]]:
    """
    Return the last few deterministic scores (UTC timestamp + score).
    """

    return [
        {"timestamp": ts.isoformat(), "score": score}
        for ts, score in list(RECENT_EVALUATIONS)
    ]
