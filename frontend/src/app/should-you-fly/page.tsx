"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useState,
} from "react";

import {
  type AgentPreference,
  type FlightContext,
  type FlightEvaluation,
  type RiskTier,
  evaluateFlight,
} from "@/lib/apiClient";

type FlightFormState = {
  agentPreference: AgentPreference;
  departure_icao: string;
  destination_icao: string;
  departure_time_utc: string;
  pilot_total_hours: string;
  pilot_hours_last_90_days: string;
  pilot_instrument_rating: boolean;
  pilot_night_current: boolean;
  aircraft_type: string;
  aircraft_mtow_kg: string;
  planned_takeoff_weight_kg: string;
  conditions_ifr_expected: boolean;
  conditions_night: boolean;
  terrain_mountainous: boolean;
  departure_visibility_sm: string;
  destination_visibility_sm: string;
  departure_ceiling_ft: string;
  destination_ceiling_ft: string;
  max_crosswind_knots: string;
  gusts_knots: string;
  freezing_level_ft: string;
  icing_risk_0_1: string;
  turbulence_risk_0_1: string;
};

const tierColors: Record<RiskTier, string> = {
  GO: "bg-emerald-500",
  CAUTION: "bg-amber-400",
  "NO-GO": "bg-rose-500",
};

const agentOptions: { value: AgentPreference; label: string }[] = [
  { value: "auto", label: "Auto (You.com → Gemini fallback)" },
  { value: "you_com", label: "Force You.com Express" },
  { value: "gemini", label: "Force Gemini agent" },
];

const buildInitialForm = (): FlightFormState => ({
  agentPreference: "auto",
  departure_icao: "KDEN",
  destination_icao: "KSLC",
  departure_time_utc: "2025-11-15T02:00",
  pilot_total_hours: "220",
  pilot_hours_last_90_days: "8",
  pilot_instrument_rating: true,
  pilot_night_current: true,
  aircraft_type: "Cirrus SR22",
  aircraft_mtow_kg: "1540",
  planned_takeoff_weight_kg: "1450",
  conditions_ifr_expected: true,
  conditions_night: true,
  terrain_mountainous: true,
  departure_visibility_sm: "4",
  destination_visibility_sm: "5",
  departure_ceiling_ft: "1500",
  destination_ceiling_ft: "1800",
  max_crosswind_knots: "14",
  gusts_knots: "26",
  freezing_level_ft: "6000",
  icing_risk_0_1: "0.35",
  turbulence_risk_0_1: "0.55",
});

export default function ShouldYouFlyPage() {
  const [form, setForm] = useState<FlightFormState>(() => buildInitialForm());
  const [result, setResult] = useState<FlightEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departureDate = new Date(form.departure_time_utc);
  const departureDisplay = Number.isNaN(departureDate.getTime())
    ? "Set departure time"
    : departureDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
  const aiSourceLabel = result
    ? result.explanation.source === "You.com"
      ? "You.com Express"
      : "Gemini Agent"
    : "Awaiting AI";

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const toInt = (value: string) => Number.parseInt(value || "0", 10);
    const toFloat = (value: string) => Number.parseFloat(value || "0");

    const payload: FlightContext = {
      departure_icao: form.departure_icao.trim().toUpperCase(),
      destination_icao: form.destination_icao.trim().toUpperCase(),
      departure_time_utc: new Date(form.departure_time_utc).toISOString(),
      pilot_total_hours: toInt(form.pilot_total_hours),
      pilot_hours_last_90_days: toInt(form.pilot_hours_last_90_days),
      pilot_instrument_rating: form.pilot_instrument_rating,
      pilot_night_current: form.pilot_night_current,
      aircraft_type: form.aircraft_type,
      aircraft_mtow_kg: toFloat(form.aircraft_mtow_kg),
      planned_takeoff_weight_kg: toFloat(form.planned_takeoff_weight_kg),
      conditions_ifr_expected: form.conditions_ifr_expected,
      conditions_night: form.conditions_night,
      terrain_mountainous: form.terrain_mountainous,
      departure_visibility_sm: toFloat(form.departure_visibility_sm),
      destination_visibility_sm: toFloat(form.destination_visibility_sm),
      departure_ceiling_ft: toInt(form.departure_ceiling_ft),
      destination_ceiling_ft: toInt(form.destination_ceiling_ft),
      max_crosswind_knots: toFloat(form.max_crosswind_knots),
      gusts_knots: toFloat(form.gusts_knots),
      freezing_level_ft: form.freezing_level_ft
        ? toInt(form.freezing_level_ft)
        : null,
      icing_risk_0_1: toFloat(form.icing_risk_0_1),
      turbulence_risk_0_1: toFloat(form.turbulence_risk_0_1),
    };

    try {
      const evaluation = await evaluateFlight(payload, form.agentPreference);
      setResult(evaluation);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to evaluate flight risk.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(15,118,110,0.16),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[length:32px_32px] bg-[linear-gradient(transparent_31px,_rgba(148,163,184,0.08)_32px),linear-gradient(90deg,transparent_31px,_rgba(148,163,184,0.08)_32px)]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <header className="text-center lg:text-left">
          <p className="text-xs uppercase tracking-[0.6em] text-sky-400">
            Flight readiness
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Deterministic risk + AI copilots for every mission briefing
          </h1>
          <p className="mt-5 max-w-3xl text-base text-slate-300">
            Fuse rule-based scoring with live intel from You.com and Gemini. Get
            a transparent score, see which factors fired, and let the AI layer
            narrate the “why” in plain language.
          </p>
        </header>

        <MissionSummary
          route={`${form.departure_icao || "----"} → ${
            form.destination_icao || "----"
          }`}
          departureTime={departureDisplay}
          tier={result?.risk.tier ?? null}
          score={result?.risk.score ?? null}
          agentLabel={aiSourceLabel}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-sky-950/40 backdrop-blur"
          >
            <Section title="AI Assistant">
              <label className="block text-sm font-semibold text-slate-200">
                Preferred explainer
                <select
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  name="agentPreference"
                  value={form.agentPreference}
                  onChange={handleInputChange}
                >
                  {agentOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="text-slate-900"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-400">
                Auto tries You.com first for cited live data, then falls back to
                Gemini for telemetry-assisted reasoning.
              </p>
            </Section>

            <Section title="Flight Plan">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Departure ICAO"
                  name="departure_icao"
                  value={form.departure_icao}
                  onChange={handleInputChange}
                  placeholder="KSEA"
                  required
                />
                <InputField
                  label="Destination ICAO"
                  name="destination_icao"
                  value={form.destination_icao}
                  onChange={handleInputChange}
                  placeholder="KSFO"
                  required
                />
              </div>
              <InputField
                label="Departure (UTC)"
                name="departure_time_utc"
                type="datetime-local"
                value={form.departure_time_utc}
                onChange={handleInputChange}
                required
              />
            </Section>

            <Section title="Pilot">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Total Hours"
                  name="pilot_total_hours"
                  type="number"
                  value={form.pilot_total_hours}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Hours (Last 90 days)"
                  name="pilot_hours_last_90_days"
                  type="number"
                  value={form.pilot_hours_last_90_days}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Checkbox
                  label="Instrument rated"
                  name="pilot_instrument_rating"
                  checked={form.pilot_instrument_rating}
                  onChange={handleCheckboxChange}
                />
                <Checkbox
                  label="Night current"
                  name="pilot_night_current"
                  checked={form.pilot_night_current}
                  onChange={handleCheckboxChange}
                />
              </div>
            </Section>

            <Section title="Aircraft">
              <InputField
                label="Type"
                name="aircraft_type"
                value={form.aircraft_type}
                onChange={handleInputChange}
                required
              />
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="MTOW (kg)"
                  name="aircraft_mtow_kg"
                  type="number"
                  value={form.aircraft_mtow_kg}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Planned takeoff weight (kg)"
                  name="planned_takeoff_weight_kg"
                  type="number"
                  value={form.planned_takeoff_weight_kg}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </Section>

            <Section title="Conditions & Terrain">
              <div className="grid gap-4 md:grid-cols-3">
                <Checkbox
                  label="IFR expected"
                  name="conditions_ifr_expected"
                  checked={form.conditions_ifr_expected}
                  onChange={handleCheckboxChange}
                />
                <Checkbox
                  label="Night segment"
                  name="conditions_night"
                  checked={form.conditions_night}
                  onChange={handleCheckboxChange}
                />
                <Checkbox
                  label="Mountainous terrain"
                  name="terrain_mountainous"
                  checked={form.terrain_mountainous}
                  onChange={handleCheckboxChange}
                />
              </div>
            </Section>

            <Section title="Weather Inputs">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Departure visibility (SM)"
                  name="departure_visibility_sm"
                  type="number"
                  step="0.1"
                  value={form.departure_visibility_sm}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Destination visibility (SM)"
                  name="destination_visibility_sm"
                  type="number"
                  step="0.1"
                  value={form.destination_visibility_sm}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Departure ceiling (ft)"
                  name="departure_ceiling_ft"
                  type="number"
                  value={form.departure_ceiling_ft}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Destination ceiling (ft)"
                  name="destination_ceiling_ft"
                  type="number"
                  value={form.destination_ceiling_ft}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Max crosswind (kt)"
                  name="max_crosswind_knots"
                  type="number"
                  value={form.max_crosswind_knots}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Gusts (kt)"
                  name="gusts_knots"
                  type="number"
                  value={form.gusts_knots}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Freezing level (ft)"
                  name="freezing_level_ft"
                  type="number"
                  value={form.freezing_level_ft}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
                <InputField
                  label="Icing risk (0–1)"
                  name="icing_risk_0_1"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={form.icing_risk_0_1}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Turbulence risk (0–1)"
                  name="turbulence_risk_0_1"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={form.turbulence_risk_0_1}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </Section>

            <button
              type="submit"
              className="group w-full rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 py-3 font-semibold text-slate-900 shadow-lg shadow-sky-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {isLoading ? "Evaluating flight..." : "Evaluate flight"}
                <span className="text-base transition group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </button>

            {error && (
              <p className="text-sm text-rose-400">
                {error} (ensure backend & Gemini key are configured)
              </p>
            )}
          </form>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
              {result ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                        Risk score
                      </p>
                      <p className="text-4xl font-semibold text-white">
                        {result.risk.score}
                      </p>
                    </div>
                    <BadgePill tier={result.risk.tier} />
                  </div>
                  <div className="mt-4">
                    <RiskMeter
                      score={result.risk.score}
                      tier={result.risk.tier}
                    />
                  </div>
                  {result.risk.factors.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Fired factors
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                        {result.risk.factors.map((factor) => (
                          <li
                            key={factor.label}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200"
                          >
                            {factor.label} (+{factor.impact})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-semibold text-white">
                        Why this assessment
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                          result.explanation.source === "You.com"
                            ? "bg-indigo-600"
                            : "bg-teal-600"
                        }`}
                      >
                        AI co-pilot · {aiSourceLabel}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-200">
                      {result.explanation.explanation}
                    </p>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Recommendations
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-100">
                          {result.explanation.recommendations.map(
                            (recommendation) => (
                              <li
                                key={recommendation}
                                className="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2 shadow-inner shadow-black/30"
                              >
                                <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
                                {recommendation}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      {result.explanation.telemetry_findings &&
                        result.explanation.telemetry_findings.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Telemetry insights
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-100">
                              {result.explanation.telemetry_findings.map(
                                (finding) => (
                                  <li
                                    key={finding}
                                    className="rounded-xl border border-white/5 bg-gradient-to-r from-sky-500/10 to-transparent px-3 py-2"
                                  >
                                    {finding}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-center text-slate-300">
                  <p className="text-xl font-semibold text-white">
                    Awaiting flight evaluation
                  </p>
                  <p className="text-sm">
                    Plug in your mission, choose an AI assistant, and tap
                    “Evaluate flight” to receive a risk tier with narrative
                    context.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoPanel
                title="Deterministic engine"
                body="Transparent scores with rule-level explainability, designed for preflight personal minimums."
              />
              <InfoPanel
                title="AI briefing layer"
                body="You.com Express for cited web intel, Gemini for telemetry comparisons—both ready on demand."
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="h-8 w-0.5 rounded-full bg-gradient-to-b from-sky-400 to-slate-600" />
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
          {title}
        </p>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function InputField(
  props: InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 shadow-inner shadow-black/20 placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        {...rest}
      />
    </label>
  );
}

function Checkbox(
  props: InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-white/20 bg-slate-900 text-sky-400 focus:ring-sky-500"
        {...rest}
      />
      {label}
    </label>
  );
}

function RiskMeter({ score, tier }: { score: number; tier: RiskTier }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>0</span>
        <span>100</span>
      </div>
      <div className="mt-2 h-3 w-full rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${tierColors[tier]} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function MissionSummary({
  route,
  departureTime,
  tier,
  score,
  agentLabel,
}: {
  route: string;
  departureTime: string;
  tier: RiskTier | null;
  score: number | null;
  agentLabel: string;
}) {
  const cards = [
    { label: "Route", value: route },
    { label: "Departure", value: departureTime },
    { label: "Risk tier", value: tier ?? "Pending" },
    {
      label: "Score",
      value: score !== null ? `${score}%` : "—",
    },
    { label: "AI source", value: agentLabel },
  ];

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Mission summary
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{route}</p>
        </div>
        {tier && score !== null ? (
          <BadgePill tier={tier} />
        ) : (
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs text-slate-300">
            Pending evaluation
          </span>
        )}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 shadow-inner shadow-black/40">
      <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function BadgePill({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={`rounded-full px-4 py-1 text-sm font-semibold text-white shadow-lg shadow-black/40 ${tierColors[tier]}`}
    >
      {tier}
    </span>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-sm text-slate-100">{body}</p>
    </div>
  );
}
