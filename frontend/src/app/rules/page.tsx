import Link from "next/link";

type Rule = {
  title: string;
  description: string;
  impact: number;
};

type RuleGroup = {
  group: string;
  rules: Rule[];
};

const ruleGroups: RuleGroup[] = [
  {
    group: "Pilot Experience",
    rules: [
      {
        title: "Pilot total hours < 50",
        description: "Low-time pilots carry the highest base risk until experience builds.",
        impact: 25,
      },
      {
        title: "Pilot total hours < 100",
        description: "Moderate penalty applied when still early in the learning curve.",
        impact: 15,
      },
      {
        title: "Pilot flew < 10 hours in last 90 days",
        description: "Recent recency is critical; low recency adds 15 points.",
        impact: 15,
      },
    ],
  },
  {
    group: "Aircraft Loading",
    rules: [
      {
        title: "Planned takeoff weight > 90% MTOW",
        description: "High fuel/passenger load squeezes margins on performance and climb.",
        impact: 15,
      },
    ],
  },
  {
    group: "Ratings vs Conditions",
    rules: [
      {
        title: "IFR expected but pilot not instrument-rated",
        description: "Largest single penalty—launching IFR without the rating is unsafe.",
        impact: 30,
      },
      {
        title: "Night flight with lapsed night currency",
        description: "Adds 20 points when operating in the dark without recent recency.",
        impact: 20,
      },
    ],
  },
  {
    group: "Winds & Runway Environment",
    rules: [
      {
        title: "Crosswind component > 20 kt",
        description: "High crosswinds hit with 30 points; 15–20 kt adds a smaller penalty.",
        impact: 30,
      },
      {
        title: "Crosswind component > 15 kt",
        description: "Moderate crosswinds stack 20 points unless mitigated.",
        impact: 20,
      },
      {
        title: "Large gust spread (>15 kt)",
        description: "Big gust deltas hint at unstable approaches and roll-out.",
        impact: 10,
      },
    ],
  },
  {
    group: "Weather Minimums",
    rules: [
      {
        title: "Visibility under 3 SM (departure or destination)",
        description: "Each leg must meet personal and regulatory minimums.",
        impact: 20,
      },
      {
        title: "Ceiling under 1000 ft (departure or destination)",
        description: "Low ceilings increase runway environment risk.",
        impact: 20,
      },
    ],
  },
  {
    group: "Icing / Turbulence",
    rules: [
      {
        title: "Severe icing risk (> 0.7)",
        description: "Heavy icing probability adds 35 points.",
        impact: 35,
      },
      {
        title: "Moderate icing risk (> 0.5)",
        description: "Moderate icing still adds a meaningful 25 points.",
        impact: 25,
      },
      {
        title: "Elevated turbulence risk (> 0.5)",
        description: "Rough air above moderate levels adds 15 points.",
        impact: 15,
      },
    ],
  },
];

export default function RulesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.18),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[length:32px_32px] bg-[linear-gradient(transparent_31px,_rgba(148,163,184,0.08)_32px),linear-gradient(90deg,transparent_31px,_rgba(148,163,184,0.08)_32px)]" />
      </div>
      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-sky-300">
              Deterministic layer
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Rulebook driving the Should You Fly? score
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Each rule below adds a fixed number of points when true. Scores are
              clamped between 0–100 before mapping to GO / CAUTION / NO-GO. Pair
              these hard rules with AI context for the full briefing.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
            >
              ← Back home
            </Link>
            <Link
              href="/should-you-fly"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-900/30 transition hover:scale-[1.01]"
            >
              Launch the assistant
            </Link>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {ruleGroups.map((group) => (
            <section
              key={group.group}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-8 w-0.5 rounded-full bg-gradient-to-b from-sky-400 to-slate-600" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-300">
                  {group.group}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {group.rules.map((rule) => (
                  <article
                    key={`${group.group}-${rule.title}`}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-inner shadow-black/40"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-white">
                        {rule.title}
                      </p>
                      <span className="rounded-full border border-sky-300/40 px-3 py-1 text-xs text-sky-200">
                        +{rule.impact} pts
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{rule.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

