from __future__ import annotations

import os
from textwrap import dedent

import httpx

from backend.schemas import AgentExplanation, FlightContext, RiskResult
from backend.services.agent_utils import try_parse_agent_output

_DEFAULT_API_URL = "https://api.you.com/express"


class YouComClientError(RuntimeError):
    """Raised when the You.com API cannot fulfill a request."""


async def generate_you_com_explanation(
    context: FlightContext,
    risk: RiskResult,
) -> AgentExplanation:
    api_key = os.getenv("YOU_COM_API_KEY")
    if not api_key:
        raise YouComClientError("YOU_COM_API_KEY is not set.")

    endpoint = os.getenv("YOU_COM_API_URL", _DEFAULT_API_URL)
    prompt = _build_prompt(context, risk)

    timeout = httpx.Timeout(30.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            endpoint,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"query": prompt},
        )
    response.raise_for_status()
    data = response.json()

    answer = (
        data.get("answer")
        or data.get("response")
        or data.get("text")
        or data.get("content")
    )
    if not answer:
        raise YouComClientError(f"Unexpected response shape: {data}")

    parsed = try_parse_agent_output(answer)
    if parsed:
        return parsed

    raise YouComClientError("You.com response was not valid AgentExplanation JSON.")


def _build_prompt(context: FlightContext, risk: RiskResult) -> str:
    factors = "\n".join(
        f"- {factor.label} (+{factor.impact})" for factor in risk.factors
    )
    if not factors:
        factors = "- No specific rule-based risk factors triggered."

    return dedent(
        f"""
        You are an aviation safety assistant. Given the structured flight context and
        deterministic risk engine output, respond with concise safety guidance.

        Respond strictly with minified JSON using this schema:
        {{
            "explanation": "2-4 sentence narrative about why GO/CAUTION/NO-GO",
            "recommendations": [
                "actionable recommendation 1",
                "actionable recommendation 2",
                "actionable recommendation 3"
            ],
            "telemetry_findings": [
                "optional short historical telemetry insight",
                "... or leave array empty"
            ]
        }}

        Always keep explanation under 4 sentences, use imperative verbs in
        recommendations, and ensure JSON is valid.

        Flight:
        - Route: {context.departure_icao} to {context.destination_icao}
        - Departure UTC: {context.departure_time_utc.isoformat()}
        - Pilot total hours: {context.pilot_total_hours}
        - Pilot hours (90d): {context.pilot_hours_last_90_days}
        - Instrument rated: {context.pilot_instrument_rating}
        - Night current: {context.pilot_night_current}
        - Aircraft type: {context.aircraft_type}
        - MTOW kg: {context.aircraft_mtow_kg}
        - Planned takeoff weight kg: {context.planned_takeoff_weight_kg}
        - IFR expected: {context.conditions_ifr_expected}
        - Night segment: {context.conditions_night}
        - Mountainous terrain: {context.terrain_mountainous}

        Weather inputs:
        - Departure visibility SM: {context.departure_visibility_sm}
        - Destination visibility SM: {context.destination_visibility_sm}
        - Departure ceiling ft: {context.departure_ceiling_ft}
        - Destination ceiling ft: {context.destination_ceiling_ft}
        - Max crosswind kt: {context.max_crosswind_knots}
        - Gusts kt: {context.gusts_knots}
        - Freezing level ft: {context.freezing_level_ft}
        - Icing risk 0-1: {context.icing_risk_0_1}
        - Turbulence risk 0-1: {context.turbulence_risk_0_1}

        Risk engine:
        - Score: {risk.score}
        - Tier: {risk.tier}
        - Fired factors:
        {factors}
        """
    ).strip()
