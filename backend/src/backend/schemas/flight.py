from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class FlightContext(BaseModel):
    """
    Normalized request payload describing a planned flight.

    The fields follow the structure requested in the spec so the frontend can map
    them 1:1 without further transformation.
    """

    model_config = ConfigDict(extra="forbid")

    # Flight
    departure_icao: str
    destination_icao: str
    departure_time_utc: datetime

    # Pilot
    pilot_total_hours: int
    pilot_hours_last_90_days: int
    pilot_instrument_rating: bool
    pilot_night_current: bool

    # Aircraft
    aircraft_type: str
    aircraft_mtow_kg: float
    planned_takeoff_weight_kg: float

    # Conditions
    conditions_ifr_expected: bool
    conditions_night: bool
    terrain_mountainous: bool

    # Weather inputs
    departure_visibility_sm: float
    destination_visibility_sm: float
    departure_ceiling_ft: int
    destination_ceiling_ft: int
    max_crosswind_knots: float
    gusts_knots: float
    freezing_level_ft: int | None
    icing_risk_0_1: float
    turbulence_risk_0_1: float


class RiskFactor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    impact: int


class RiskResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: int
    tier: Literal["GO", "CAUTION", "NO-GO"]
    factors: list[RiskFactor]


ExplanationSource = Literal["You.com", "Gemini"]


AgentPreference = Literal["auto", "you_com", "gemini"]


class AgentExplanation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    explanation: str
    recommendations: list[str]
    telemetry_findings: list[str] | None = None
    source: ExplanationSource = "Gemini"


class FlightEvaluation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    risk: RiskResult
    explanation: AgentExplanation
