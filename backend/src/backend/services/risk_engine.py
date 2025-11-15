from __future__ import annotations

from backend.schemas import FlightContext, RiskFactor, RiskResult


def compute_risk(context: FlightContext) -> RiskResult:
    """
    Deterministic rule-based scoring with transparent factors.

    Each rule contributes a fixed number of points. The score is clamped to the
    0–100 range before mapping to the GO/CAUTION/NO-GO tiers.
    """

    score = 0
    factors: list[RiskFactor] = []

    def record(condition: bool, label: str, impact: int) -> None:
        nonlocal score
        if condition:
            score += impact
            factors.append(RiskFactor(label=label, impact=impact))

    # Pilot experience
    if context.pilot_total_hours < 50:
        record(True, "Pilot total hours < 50", 25)
    elif context.pilot_total_hours < 100:
        record(True, "Pilot total hours < 100", 15)

    record(
        context.pilot_hours_last_90_days < 10,
        "Pilot flew < 10 hours in last 90 days",
        15,
    )

    # Aircraft loading
    mtow_ratio = context.planned_takeoff_weight_kg / max(context.aircraft_mtow_kg, 1)
    record(
        mtow_ratio > 0.9,
        "Planned takeoff weight > 90% MTOW",
        15,
    )

    # Ratings vs conditions
    record(
        context.conditions_ifr_expected and not context.pilot_instrument_rating,
        "IFR expected but pilot not instrument-rated",
        30,
    )
    record(
        context.conditions_night and not context.pilot_night_current,
        "Night flight with lapsed night currency",
        20,
    )

    # Crosswind
    if context.max_crosswind_knots > 20:
        record(True, "Crosswind component > 20 kt", 30)
    elif context.max_crosswind_knots > 15:
        record(True, "Crosswind component > 15 kt", 20)

    # Visibility / ceiling at both ends
    record(
        context.departure_visibility_sm < 3 or context.destination_visibility_sm < 3,
        "Visibility under 3 SM",
        20,
    )
    record(
        context.departure_ceiling_ft < 1000 or context.destination_ceiling_ft < 1000,
        "Ceiling under 1000 ft",
        20,
    )

    # Icing / turbulence (scaled)
    if context.icing_risk_0_1 > 0.7:
        record(True, "Severe icing risk (>0.7)", 35)
    elif context.icing_risk_0_1 > 0.5:
        record(True, "Moderate icing risk (>0.5)", 25)

    record(
        context.turbulence_risk_0_1 > 0.5,
        "Elevated turbulence risk (>0.5)",
        15,
    )

    # Gust spread
    record(
        context.gusts_knots - context.max_crosswind_knots > 15,
        "Large gust spread (>15 kt)",
        10,
    )

    clamped_score = max(0, min(100, score))
    tier = _tier_for_score(clamped_score)

    return RiskResult(score=clamped_score, tier=tier, factors=factors)


def _tier_for_score(score: int) -> str:
    if score < 30:
        return "GO"
    if score < 60:
        return "CAUTION"
    return "NO-GO"

