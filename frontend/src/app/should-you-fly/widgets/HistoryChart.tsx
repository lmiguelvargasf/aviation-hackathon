"use client";

import Chart from "chart.js/auto";
import { useEffect, useMemo, useRef } from "react";

import type { EvaluationHistoryPoint } from "@/lib/apiClient";

export function HistoryChart({ data }: { data: EvaluationHistoryPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pacificFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }),
    [],
  );
  const labels = useMemo(
    () =>
      data.map((point) => pacificFormatter.format(new Date(point.timestamp))),
    [data, pacificFormatter],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(14,165,233,0.4)");
    gradient.addColorStop(1, "rgba(14,165,233,0)");

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Score",
            data: data.map((point) => point.score),
            borderColor: "rgba(56,189,248,1)",
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: "rgba(125,211,252,1)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: "#cbd5f5" },
            grid: { color: "rgba(148,163,184,0.15)" },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148,163,184,0.15)" },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [data, labels]);

  return <canvas ref={canvasRef} className="h-48 w-full" />;
}
