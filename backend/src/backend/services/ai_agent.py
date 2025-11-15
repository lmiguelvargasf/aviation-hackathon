from __future__ import annotations

import inspect
import os
from textwrap import dedent
from typing import Any

from pydantic_ai import Agent, RunContext
from pydantic_ai.models.google import GoogleModel

from backend.schemas import AgentExplanation, FlightContext, RiskResult
from backend.services.agent_utils import coerce_agent_result
from backend.services.telemetry_tools import (
    PerformanceSummary,
    WeatherEnvSummary,
    WeightFuelSummary,
    WowSummary,
    analyze_performance,
    analyze_weather_env,
    analyze_weight_fuel,
    analyze_wow,
)
from backend.services.you_com_client import generate_you_com_explanation

_AGENT_INIT_SIGNATURE = inspect.signature(Agent)
_AGENT_RUN_SIGNATURE = inspect.signature(Agent.run)
_SUPPORTS_RESULT_TYPE_AT_INIT = "result_type" in _AGENT_INIT_SIGNATURE.parameters
_SUPPORTS_RESULT_TYPE_AT_RUN = "result_type" in _AGENT_RUN_SIGNATURE.parameters

_agent_kwargs: dict[str, Any] = {}
if _SUPPORTS_RESULT_TYPE_AT_INIT:
    _agent_kwargs["result_type"] = AgentExplanation

agent = Agent(
    GoogleModel("gemini-2.5-flash-lite"),
    instructions=dedent(
        """
        You are an aviation safety assistant.
        You receive a planned flight context and the output of a deterministic risk
        engine (score, tier, and fired risk factors).
        You can call telemetry tools that summarize patterns from a historical sortie
        CSV (AirForce_Sortie_Aeromod.csv). Use telemetry ONLY as illustrative,
        comparative color—not as the actual flight data.

        Respond strictly with JSON matching:
        {
            "explanation": "2-4 sentence narrative",
            "recommendations": ["actionable recommendation", "..."],
            "telemetry_findings": ["short optional insight", "..."]
        }

        Make sure:
        1. A short explanation (2–4 sentences) of why the flight is GO / CAUTION /
           NO-GO.
        2. Three to five concrete safety recommendations.
        3. Optional short telemetry findings if the tools reveal interesting signals.
        """
    ).strip(),
    **_agent_kwargs,
)


@agent.tool
def tool_analyze_weather_env(_: RunContext[None]) -> WeatherEnvSummary:
    return analyze_weather_env()


@agent.tool
def tool_analyze_weight_fuel(_: RunContext[None]) -> WeightFuelSummary:
    return analyze_weight_fuel()


@agent.tool
def tool_analyze_wow(_: RunContext[None]) -> WowSummary:
    return analyze_wow()


@agent.tool
def tool_analyze_performance(_: RunContext[None]) -> PerformanceSummary:
    return analyze_performance()


async def generate_agent_explanation(
    context: FlightContext,
    risk: RiskResult,
) -> AgentExplanation:
    """
    Execute the configured agent using the structured flight context / risk record.
    """
    you_com_key = os.getenv("YOU_COM_API_KEY")
    last_error: Exception | None = None
    if you_com_key:
        try:
            return await generate_you_com_explanation(context, risk)
        except Exception as exc:  # pragma: no cover - best-effort integration
            last_error = exc

    if os.getenv("GOOGLE_API_KEY"):
        return await _run_gemini_agent(context, risk)

    if last_error:
        raise RuntimeError(f"You.com agent failed: {last_error}") from last_error
    raise RuntimeError(
        "Set YOU_COM_API_KEY or GOOGLE_API_KEY to enable AI explanations."
    )


async def _run_gemini_agent(
    context: FlightContext,
    risk: RiskResult,
) -> AgentExplanation:
    if not os.getenv("GOOGLE_API_KEY"):
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Provide a Gemini key to enable the agent."
        )

    risk_summary = {
        "score": risk.score,
        "tier": risk.tier,
        "factors": [f"{factor.label} (+{factor.impact})" for factor in risk.factors],
    }
    flight_summary = {
        "route": f"{context.departure_icao} → {context.destination_icao}",
        "departure_time": context.departure_time_utc.isoformat(),
        "pilot_hours": {
            "total": context.pilot_total_hours,
            "last_90_days": context.pilot_hours_last_90_days,
        },
        "conditions": {
            "ifr_expected": context.conditions_ifr_expected,
            "night": context.conditions_night,
            "mountainous": context.terrain_mountainous,
        },
        "weather": {
            "vis_depart": context.departure_visibility_sm,
            "vis_dest": context.destination_visibility_sm,
            "ceiling_depart": context.departure_ceiling_ft,
            "ceiling_dest": context.destination_ceiling_ft,
            "max_crosswind": context.max_crosswind_knots,
            "gusts": context.gusts_knots,
            "icing_risk": context.icing_risk_0_1,
            "turbulence_risk": context.turbulence_risk_0_1,
        },
    }

    run_input = {
        "flight": flight_summary,
        "risk": risk_summary,
    }

    run_kwargs: dict[str, Any] = {}
    if not _SUPPORTS_RESULT_TYPE_AT_INIT and _SUPPORTS_RESULT_TYPE_AT_RUN:
        run_kwargs["result_type"] = AgentExplanation

    result = await agent.run(run_input, **run_kwargs)
    return coerce_agent_result(result)
