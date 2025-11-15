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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-500">
          Should You Fly?
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          Go / No-Go Decision Assistant
        </h1>
        <p className="mt-3 text-gray-600">
          Plug in your mission basics and get a deterministic risk score plus an
          AI-assisted explanation with telemetry context.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <Section title="AI Assistant">
            <label className="block text-sm font-medium text-gray-700">
              Preferred explainer
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                name="agentPreference"
                value={form.agentPreference}
                onChange={handleInputChange}
              >
                {agentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-gray-500">
              Auto tries You.com first for live, cited intel and falls back to
              Gemini plus telemetry tools if needed.
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
                step="0.1"
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
                step="0.1"
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
            className="w-full rounded-xl bg-sky-600 py-3 text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "Evaluating..." : "Evaluate Flight"}
          </button>

          {error && (
            <p className="text-sm text-rose-500">
              {error} (ensure backend & Gemini key are configured)
            </p>
          )}
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {result ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Risk score</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {result.risk.score}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-4 py-1 text-sm font-semibold text-white ${tierColors[result.risk.tier]}`}
                  >
                    {result.risk.tier}
                  </span>
                </div>
                <div className="mt-4">
                  <RiskMeter
                    score={result.risk.score}
                    tier={result.risk.tier}
                  />
                </div>
                {result.risk.factors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Key factors
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                      {result.risk.factors.map((factor) => (
                        <li
                          key={factor.label}
                          className="rounded-full bg-gray-100 px-3 py-1 text-gray-700"
                        >
                          {factor.label} (+{factor.impact})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-gray-900">
                      Why this assessment
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                        result.explanation.source === "You.com"
                          ? "bg-indigo-600"
                          : "bg-slate-700"
                      }`}
                    >
                      {result.explanation.source === "You.com"
                        ? "AI co-pilot · You.com Express"
                        : "AI co-pilot · Gemini agent"}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    {result.explanation.explanation}
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Recommendations
                    </p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-700">
                      {result.explanation.recommendations.map(
                        (recommendation) => (
                          <li key={recommendation}>{recommendation}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
                {result.explanation.telemetry_findings &&
                  result.explanation.telemetry_findings.length > 0 && (
                    <div className="mt-6 rounded-xl bg-sky-50 p-4">
                      <p className="text-sm font-semibold text-sky-800">
                        Telemetry insights
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sky-900">
                        {result.explanation.telemetry_findings.map(
                          (finding) => (
                            <li key={finding}>{finding}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-lg font-semibold text-gray-700">
                  Awaiting flight evaluation
                </p>
                <p className="mt-2 text-sm">
                  Fill out the form and tap “Evaluate Flight” to fetch a risk
                  score and AI analysis.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Gemini-powered agent</p>
            <p className="mt-2">
              Results combine a deterministic rule set with a Gemini agent that
              can query illustrative telemetry summaries. Make sure
              <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs">
                GOOGLE_API_KEY
              </code>
              is set on the backend for best results.
            </p>
          </div>
        </div>
      </div>
    </div>
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
    <section>
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function InputField(
  props: InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
        {...rest}
      />
      {label}
    </label>
  );
}

function RiskMeter({ score, tier }: { score: number; tier: RiskTier }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>100</span>
      </div>
      <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${tierColors[tier]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
