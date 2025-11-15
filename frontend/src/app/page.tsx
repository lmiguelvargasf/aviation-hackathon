import Link from "next/link";

export default function Home() {
  const stats = [
    { label: "Deterministic rules", value: "12+" },
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

        <div className="mt-14 grid w-full gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-3 text-xl font-semibold text-white">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
