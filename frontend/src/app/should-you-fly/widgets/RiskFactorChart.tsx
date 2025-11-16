"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

import type { RiskFactor } from "@/lib/apiClient";

export function RiskFactorChart({ factors }: { factors: RiskFactor[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: factors.map((factor) => factor.label),
        datasets: [
          {
            label: "Impact (pts)",
            data: factors.map((factor) => factor.impact),
            backgroundColor: "rgba(56,189,248,0.6)",
            borderColor: "rgba(14,165,233,1)",
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `+${context.parsed.y} pts`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#cbd5f5",
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#94a3b8",
              stepSize: 5,
            },
            grid: {
              color: "rgba(148,163,184,0.2)",
            },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [factors]);

  return <canvas ref={canvasRef} className="h-48 w-full" />;
}

