"use client";

import React from "react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------- Donut
export function Donut({
  data,
  size = 168,
  thickness = 20,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e6eaf4"
            strokeWidth={thickness}
          />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-lg font-bold leading-tight text-ink-900 tnum">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[10px] font-medium text-ink-400">{centerLabel}</span>
          )}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: d.color }}
            />
            <span className="truncate text-ink-600">{d.label}</span>
            <span className="ml-auto shrink-0 font-semibold text-ink-800 tnum">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Bars
export function BarChart({
  data,
  height = 180,
  valueFormat,
  color = "#3d4a80",
  compareColor,
}: {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  valueFormat?: (n: number) => string;
  color?: string;
  compareColor?: string;
}) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.value2 ?? 0)), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center gap-0.5">
              {d.value2 !== undefined && (
                <div
                  className="w-full max-w-[14px] rounded-t-[3px] bg-ink-300 transition-all"
                  style={{ height: `${(d.value2 / max) * 100}%` }}
                  title={`${d.label}: ${valueFormat ? valueFormat(d.value2) : d.value2}`}
                />
              )}
              <div
                className="w-full max-w-[18px] rounded-t-[3px] transition-all group-hover:opacity-80"
                style={{
                  height: `${Math.max(2, (d.value / max) * 100)}%`,
                  background: color,
                }}
                title={`${d.label}: ${valueFormat ? valueFormat(d.value) : d.value}`}
              />
            </div>
            <span className="truncate text-[9px] font-medium text-ink-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2 text-[10px] text-ink-400">
        <span>អតិបរមា: <b className="text-ink-700">{valueFormat ? valueFormat(max) : max}</b></span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Line/Area
export function AreaChart({
  points,
  height = 160,
  labels,
  format,
}: {
  points: number[];
  height?: number;
  labels?: string[];
  format?: (n: number) => string;
}) {
  const w = 100;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = points.length > 1 ? w / (points.length - 1) : w;

  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = 40 - ((p - min) / range) * 38;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const area = `${path} L${w},40 L0,40 Z`;

  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ height, width: "100%" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d4a80" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3d4a80" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 10, 20, 30, 40].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e6eaf4" strokeWidth="0.2" />
        ))}
        <path d={area} fill="url(#areaGrad)" />
        <path d={path} fill="none" stroke="#3d4a80" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => {
          const x = i * step;
          const y = 40 - ((p - min) / range) * 38;
          return <circle key={i} cx={x} cy={y} r="0.7" fill="#fff" stroke="#3d4a80" strokeWidth="0.5" />;
        })}
      </svg>
      {labels && (
        <div className="mt-1 flex justify-between text-[9px] text-ink-400">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Stacked bar
export function StackedBar({
  segments,
  height = 10,
  className,
}: {
  segments: { label: string; value: number; color: string }[];
  height?: number;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div
      className={cn("flex w-full overflow-hidden rounded-full bg-ink-100", className)}
      style={{ height }}
    >
      {segments.map((s, i) => (
        <div
          key={i}
          style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          title={`${s.label}: ${((s.value / total) * 100).toFixed(1)}%`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Sparkline
export function Sparkline({ points, color = "#0f9b8e" }: { points: number[]; color?: string }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = points.length > 1 ? 100 / (points.length - 1) : 100;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(24 - ((p - min) / range) * 22).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-6 w-full">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
