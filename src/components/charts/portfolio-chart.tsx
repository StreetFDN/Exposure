"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PortfolioDataPoint {
  date: string;
  value: number;
}

interface PortfolioChartProps {
  data: PortfolioDataPoint[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Time range config
// ---------------------------------------------------------------------------

const TIME_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: Infinity },
] as const;

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: Record<string, any>) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="mb-0.5 text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-100">
        ${payload[0]?.value?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PortfolioChart({ data, className }: PortfolioChartProps) {
  const [range, setRange] = useState<number>(Infinity);

  const filteredData = useMemo(() => {
    if (range === Infinity) return data;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return data.filter((d) => new Date(d.date) >= cutoff);
  }, [data, range]);

  const latestValue = filteredData.length > 0 ? filteredData[filteredData.length - 1].value : 0;
  const firstValue = filteredData.length > 0 ? filteredData[0].value : 0;
  const change = latestValue - firstValue;
  const changePct = firstValue > 0 ? (change / firstValue) * 100 : 0;

  return (
    <div className={className}>
      {/* Header row */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="font-serif text-2xl font-light text-zinc-100">
            ${latestValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p
            className={cn(
              "text-sm font-light",
              change >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {change >= 0 ? "+" : ""}
            ${Math.abs(change).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ({changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%)
          </p>
        </div>

        {/* Range selector */}
        <div className="flex gap-1">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.label}
              type="button"
              onClick={() => setRange(tr.days)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === tr.days
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#a1a1aa" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
              width={52}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#a1a1aa"
              strokeWidth={1.5}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
