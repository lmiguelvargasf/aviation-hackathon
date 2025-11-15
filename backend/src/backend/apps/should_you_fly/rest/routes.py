from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from backend.schemas import FlightContext, FlightEvaluation
from backend.services import compute_risk, generate_agent_explanation

router = APIRouter(prefix="/api/should-you-fly", tags=["should-you-fly"])


@router.post("/evaluate", response_model=FlightEvaluation)
async def evaluate_flight(context: FlightContext) -> FlightEvaluation:
    """
    Run the deterministic risk engine plus the AI explanation layer.
    """

    risk = compute_risk(context)
    try:
        explanation = await generate_agent_explanation(context, risk)
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

