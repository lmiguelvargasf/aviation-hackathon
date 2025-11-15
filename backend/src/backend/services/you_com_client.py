from __future__ import annotations

import os
from textwrap import shorten

import httpx

from backend.schemas import AgentExplanation, FlightContext, RiskResult

_DEFAULT_SEARCH_URL = "https://api.ydc-index.io/v1/search"
_MAX_SNIPPET_CHARS = 220


class YouComClientError(RuntimeError):
    """Raised when the You.com API cannot fulfill a request."""


async def generate_you_com_explanation(
    context: FlightContext,
    risk: RiskResult,
) -> AgentExplanation:
    api_key = os.getenv("YOU_COM_API_KEY")
    if not api_key:
        raise YouComClientError("YOU_COM_API_KEY is not set.")

    endpoint = os.getenv("YOU_COM_SEARCH_URL", _DEFAULT_SEARCH_URL)
    query = _build_query(context, risk)

    timeout = httpx.Timeout(30.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(
            endpoint,
            headers={"X-API-Key": api_key},
            params={"query": query},
        )

    response.raise_for_status()
    data = response.json()
    web_results = _extract_web_results(data)

    explanation = _compose_explanation(risk, web_results)
    recommendations = _compose_recommendations(risk, web_results)
    citations = _build_citations(web_results)

    return AgentExplanation(
        explanation=explanation,
        recommendations=recommendations,
        telemetry_findings=citations,
        source="You.com",
    )


def _extract_web_results(payload: dict) -> list[dict]:
    results = payload.get("results") or {}
    web = results.get("web") or []
    return [item for item in web if isinstance(item, dict)]


def _compose_explanation(risk: RiskResult, web_results: list[dict]) -> str:
    factors_text = ", ".join(f.label for f in risk.factors[:3]) or "no elevated factors"
    parts = [
        f"Deterministic engine scored {risk.score} ({risk.tier}) with drivers such as {factors_text}.",
    ]
    if web_results:
        top = web_results[0]
        title = top.get("title") or "a cited reference"
        snippet = (
            top.get("description")
            or (top.get("snippets") or [None])[0]
            or "additional context on personal minimums"
        )
        snippet = shorten(snippet, width=_MAX_SNIPPET_CHARS, placeholder="…")
        url = top.get("url")
        if url:
            parts.append(f'You.com Search surfaced "{title}" ({url}) noting {snippet}.')
        else:
            parts.append(f'You.com Search surfaced "{title}" noting {snippet}.')
    else:
        parts.append(
            "You.com Search returned limited public guidance for this niche query, so lean on personal minima and telemetry."
        )
    return " ".join(parts)


def _compose_recommendations(
    risk: RiskResult,
    web_results: list[dict],
) -> list[str]:
    recs: list[str] = []
    for factor in risk.factors[:3]:
        recs.append(f"Mitigate factor: {factor.label}.")

    if web_results:
        top = web_results[0]
        recs.append(
            f"Review {top.get('title', 'the cited article')} for additional safety context."
        )

    if len(recs) < 3:
        recs.extend(
            [
                "Cross-check personal minimums against current METAR/TAF updates.",
                "Brief alternates and contingency fuel before launch.",
            ]
        )
    return recs[:5]


def _build_citations(web_results: list[dict]) -> list[str] | None:
    citations = []
    for item in web_results[:3]:
        title = item.get("title") or "You.com source"
        url = item.get("url")
        if url:
            citations.append(f"{title} – {url}")
    return citations or None


def _build_query(context: FlightContext, risk: RiskResult) -> str:
    factors = (
        ", ".join(f.label for f in risk.factors[:3]) or "general aviation risk factors"
    )
    return (
        f"Flight risk guidance for {context.aircraft_type} departing {context.departure_icao} "
        f"to {context.destination_icao} around {context.departure_time_utc.isoformat()}. "
        f"Risk tier {risk.tier} score {risk.score}. Factors: {factors}. "
        "Personal minimums and IFR considerations."
    )
