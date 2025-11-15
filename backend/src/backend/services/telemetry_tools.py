from __future__ import annotations

from pathlib import Path

import polars as pl
from pydantic import BaseModel, ConfigDict

DATA_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "AirForce_Sortie_Aeromod.csv"
)

_DATAFRAME: pl.DataFrame | None = None
_CSV_READ_KWARGS = {
    "infer_schema_length": 10000,
    "schema_overrides": {
        # Ensure ambient temp column is parsed as float even if values include decimals.
        "ADC_AMBIENT_AIR_TEMP": pl.Float64,
    },
    "null_values": ["", "NA", "NaN"],
}


class WeatherEnvSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    avg_amb_temp_c: float
    min_press_alt_ft: float
    max_press_alt_ft: float
    max_abs_aoss_deg: float
    max_aoa_deg: float
    max_airspeed: float
    risk_notes: list[str]


class WeightFuelSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    avg_fuel_flow_left: float
    avg_fuel_flow_right: float
    avg_imbalance_abs: float
    max_imbalance_abs: float
    afterburner_usage_fraction: float
    risk_notes: list[str]


class WowSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ground_fraction: float
    airborne_fraction: float
    num_takeoff_like_transitions: int
    num_landing_like_transitions: int
    risk_notes: list[str]


class PerformanceSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_mach: float
    max_airspeed: float
    max_aoa: float
    max_abs_aoss: float
    num_high_aoa_events: int
    num_high_sideslip_events: int
    event_values_present: list[int]
    risk_notes: list[str]


def analyze_weather_env() -> WeatherEnvSummary:
    df = _load_dataframe()
    weather = df.select(
        pl.col("AMB_AIR_TEMP_C").mean().alias("avg_temp"),
        pl.col("PRESS_ALT_IC").min().alias("min_press_alt"),
        pl.col("PRESS_ALT_IC").max().alias("max_press_alt"),
        pl.col("AOSS").abs().max().alias("max_abs_aoss"),
        pl.col("AOA").max().alias("max_aoa"),
        pl.max_horizontal(pl.col("AIRSPEED_IC"), pl.col("AIRSPEED_TIC"))
        .max()
        .alias("max_airspeed"),
    ).row(0, named=True)

    min_airspeed = float(
        df.select(
            pl.min_horizontal(pl.col("AIRSPEED_IC"), pl.col("AIRSPEED_TIC")).min()
        ).item()
    )
    max_airspeed = float(weather["max_airspeed"])

    risk_notes: list[str] = []
    if float(weather["max_abs_aoss"]) > 10:
        risk_notes.append("High sideslip observed → crosswind-like conditions")
    if float(weather["max_aoa"]) > 12:
        risk_notes.append("High angle-of-attack events noted")
    if max_airspeed - min_airspeed > 120:
        risk_notes.append("Large airspeed variation detected")

    return WeatherEnvSummary(
        avg_amb_temp_c=float(weather["avg_temp"]),
        min_press_alt_ft=float(weather["min_press_alt"]),
        max_press_alt_ft=float(weather["max_press_alt"]),
        max_abs_aoss_deg=float(weather["max_abs_aoss"]),
        max_aoa_deg=float(weather["max_aoa"]),
        max_airspeed=max_airspeed,
        risk_notes=risk_notes,
    )


def analyze_weight_fuel() -> WeightFuelSummary:
    df = _load_dataframe()
    stats = df.select(
        pl.col("LEFT_FUEL_FLOW").mean().alias("left_mean"),
        pl.col("RIGHT_FUEL_FLOW").mean().alias("right_mean"),
        (pl.col("LEFT_FUEL_FLOW") - pl.col("RIGHT_FUEL_FLOW"))
        .abs()
        .mean()
        .alias("avg_imbalance"),
        (pl.col("LEFT_FUEL_FLOW") - pl.col("RIGHT_FUEL_FLOW"))
        .abs()
        .max()
        .alias("max_imbalance"),
        (
            pl.any_horizontal(
                [
                    pl.col("LEFT_AB_FUEL_FLOW") > 0,
                    pl.col("RIGHT_AB_FUEL_FLOW") > 0,
                ]
            ).mean()
        ).alias("afterburner_fraction"),
    ).row(0, named=True)

    risk_notes: list[str] = []
    if float(stats["avg_imbalance"]) > 200:
        risk_notes.append("Fuel flow imbalance averaging above 200 units")
    if float(stats["max_imbalance"]) > 400:
        risk_notes.append("Peak fuel flow imbalance exceeds 400 units")
    if float(stats["afterburner_fraction"]) > 0.2:
        risk_notes.append("Frequent afterburner usage observed")

    return WeightFuelSummary(
        avg_fuel_flow_left=float(stats["left_mean"]),
        avg_fuel_flow_right=float(stats["right_mean"]),
        avg_imbalance_abs=float(stats["avg_imbalance"]),
        max_imbalance_abs=float(stats["max_imbalance"]),
        afterburner_usage_fraction=float(stats["afterburner_fraction"]),
        risk_notes=risk_notes,
    )


def analyze_wow() -> WowSummary:
    df = _load_dataframe()
    wow_cols = ["ADC_AIR_GND_WOW", "LT_GEAR_WOW", "RT_GEAR_WOW", "NOSE_WOW"]

    on_ground_series = (
        df.select(
            pl.any_horizontal([pl.col(col) > 0 for col in wow_cols]).alias("on_ground")
        )
        .get_column("on_ground")
        .to_list()
    )

    total = len(on_ground_series)
    ground_count = sum(on_ground_series)
    ground_fraction = ground_count / total if total else 0.0
    airborne_fraction = 1 - ground_fraction

    takeoffs = 0
    landings = 0
    for previous, current in zip(on_ground_series, on_ground_series[1:], strict=False):
        if previous and not current:
            takeoffs += 1
        elif not previous and current:
            landings += 1

    risk_notes: list[str] = []
    if takeoffs + landings > 10:
        risk_notes.append("Frequent WOW transitions — training or pattern work")
    if ground_fraction > 0.8:
        risk_notes.append("Aircraft spent majority of time on ground sensors")

    return WowSummary(
        ground_fraction=ground_fraction,
        airborne_fraction=airborne_fraction,
        num_takeoff_like_transitions=takeoffs,
        num_landing_like_transitions=landings,
        risk_notes=risk_notes,
    )


def analyze_performance() -> PerformanceSummary:
    df = _load_dataframe()
    perf = df.select(
        pl.col("MACH_IC").max().alias("max_mach"),
        pl.col("AIRSPEED_TIC").max().alias("max_airspeed"),
        pl.col("AOA").max().alias("max_aoa"),
        pl.col("AOSS").abs().max().alias("max_abs_aoss"),
        (pl.col("AOA") > 12).sum().alias("high_aoa_events"),
        (pl.col("AOSS").abs() > 10).sum().alias("high_aoss_events"),
    ).row(0, named=True)

    event_values = (
        df.get_column("EVENT")
        .drop_nans()
        .drop_nulls()
        .cast(pl.Int64)
        .unique()
        .sort()
        .to_list()
    )

    risk_notes: list[str] = []
    if float(perf["max_mach"]) > 0.95:
        risk_notes.append("Supersonic or near-Mach flight segments detected")
    if float(perf["max_aoa"]) > 14:
        risk_notes.append("AOA exceeds 14° indicating stall margin probes")
    if float(perf["max_abs_aoss"]) > 15:
        risk_notes.append("Strong sideslip excursions observed")

    return PerformanceSummary(
        max_mach=float(perf["max_mach"]),
        max_airspeed=float(perf["max_airspeed"]),
        max_aoa=float(perf["max_aoa"]),
        max_abs_aoss=float(perf["max_abs_aoss"]),
        num_high_aoa_events=int(perf["high_aoa_events"]),
        num_high_sideslip_events=int(perf["high_aoss_events"]),
        event_values_present=[int(value) for value in event_values],
        risk_notes=risk_notes,
    )


def _load_dataframe() -> pl.DataFrame:
    global _DATAFRAME
    if _DATAFRAME is None:
        if not DATA_PATH.exists():
            raise FileNotFoundError(
                f"Telemetry CSV not found at {DATA_PATH}. "
                "Place AirForce_Sortie_Aeromod.csv there."
            )
        _DATAFRAME = pl.read_csv(DATA_PATH, **_CSV_READ_KWARGS)
    return _DATAFRAME
