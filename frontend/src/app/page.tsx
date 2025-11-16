/* eslint-disable react/jsx-no-useless-fragment */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Stat = {
  label: string;
  value: string;
  href?: string;
};

export default function Home() {
  const stats: Stat[] = [
    { label: "Deterministic rules", value: "12+", href: "/rules" },
    { label: "AI copilots", value: "You.com + Gemini" },
    { label: "Avg. briefing time", value: "< 60s" },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[length:36px_36px] bg-[linear-gradient(transparent_35px,_rgba(148,163,184,0.08)_36px),linear-gradient(90deg,transparent_35px,_rgba(148,163,184,0.08)_36px)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-24 text-center lg:px-10">
        <p className="text-xs uppercase tracking-[0.6em] text-sky-300">
          Aviation hackathon demo
        </p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          Should You Fly?
          <span className="text-sky-300">
            {" "}
            Deterministic + AI Go/No-Go radar
          </span>
        </h1>
        <p className="mt-6 max-w-3xl text-base text-slate-300">
          Feed in your mission, get a transparent rule-based score, and let our
          AI copilots narrate the “why” with live web intel and telemetry cues.
          Built for pilots who want both discipline and intuition before wheels
          up.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/should-you-fly"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300 px-8 py-3 text-base font-semibold text-slate-900 shadow-xl shadow-sky-900/30 transition hover:scale-[1.01]"
          >
            Launch the assistant
          </Link>
          <a
            href="https://documentation.you.com/get-started/quickstart"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-8 py-3 text-base font-semibold text-white transition hover:border-white/40"
          >
            Learn about You.com →
          </a>
        </div>

        <AgentDialog />

        <div className="mt-14 grid w-full gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3">
          {stats.map((stat) => {
            const Card = stat.href ? Link : "div";
            return (
              <Card
                key={stat.label}
                {...(stat.href ? { href: stat.href } : {})}
                className={`rounded-2xl bg-white/5 p-4 transition ${
                  stat.href
                    ? "hover:bg-white/10 hover:shadow-lg hover:shadow-sky-900/20"
                    : ""
                }`}
              >
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-3 text-xl font-semibold text-white">
                  {stat.value}
                </p>
                {stat.href && (
                  <span className="mt-2 inline-flex items-center text-xs text-sky-300">
                    View rules →
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

type Suggestion = {
  label: string;
  hint: string;
  target: string;
  keywords: string[];
  icon: string;
};

const suggestionBlueprint: Suggestion[] = [
  {
    label: "Assess flight safety",
    hint: "Route to the Should You Fly? console",
    target: "/should-you-fly",
    keywords: ["assess", "safety", "fly", "go", "launch", "risk"],
    icon: "✈️",
  },
  {
    label: "Review deterministic rules",
    hint: "See every scoring rule with point values",
    target: "/rules",
    keywords: ["rule", "deterministic", "points", "scoring"],
    icon: "📋",
  },
  {
    label: "Search Google",
    hint: "Open external search in a new tab",
    target: "external",
    keywords: [],
    icon: "🌐",
  },
];

function AgentDialog() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);

  const suggestions = useMemo(() => {
    const trimmed = message.trim().toLowerCase();
    return suggestionBlueprint
      .map((suggestion) => {
        if (!trimmed) {
          return {
            ...suggestion,
            priority: suggestion.target === "external" ? 2 : 0,
          };
        }
        const match = suggestion.keywords.some((keyword) =>
          trimmed.includes(keyword),
        );
        return {
          ...suggestion,
          priority: suggestion.target === "external" ? 2 : match ? 0 : 1,
        };
      })
      .sort((a, b) => a.priority - b.priority);
  }, [message]);

  const triggerSuggestion = (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) {
      router.push("/should-you-fly");
      return;
    }
    if (suggestion.target === "external") {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(
          message || "aviation safety",
        )}`,
        "_blank",
      );
      return;
    }
    router.push(suggestion.target);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (message.trim().length === 0) return;
    triggerSuggestion(focusedIndex);
    setMessage("");
  };

  return (
    <div className="mt-12 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-2xl shadow-black/40 backdrop-blur-lg">
      <p className="text-sm uppercase tracking-[0.5em] text-sky-200">
        Agent question
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">
        Hi! How can I help you today?
      </h2>
      <form className="mt-6" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          placeholder="Type your question and press Enter…"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </form>
      {message.trim().length > 0 && (
        <div className="mt-6 space-y-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => triggerSuggestion(index)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                index === focusedIndex
                  ? "border-sky-400/60 bg-sky-500/30 text-white"
                  : "border-white/15 bg-white/5 text-slate-200 hover:border-white/40"
              }`}
            >
              <div>
                <p className="font-semibold">
                  {suggestion.icon} {suggestion.label}
                </p>
                <p className="text-xs text-slate-400">{suggestion.hint}</p>
              </div>
              <span className="text-xs text-slate-400">
                {suggestion.target === "external" ? "↗ Google" : "↪"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
