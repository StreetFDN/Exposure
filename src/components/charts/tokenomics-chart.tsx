"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenomicsDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface TokenomicsChartProps {
  data: TokenomicsDataPoint[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Default zinc palette
// ---------------------------------------------------------------------------

const ZINC_PALETTE = [
  "#d4d4d8", // zinc-300
  "#a1a1aa", // zinc-400
  "#71717a", // zinc-500
  "#52525b", // zinc-600
  "#3f3f46", // zinc-700
  "#27272a", // zinc-800
];

// ---------------------------------------------------------------------------
// Active shape renderer
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActiveShape(props: Record<string, any>) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;

  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#fafafa"
        fontSize={13}
        fontWeight={500}
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="#a1a1aa"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TokenomicsChart({ data, className }: TokenomicsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const coloredData = data.map((d, i) => ({
    ...d,
    color: d.color ?? ZINC_PALETTE[i % ZINC_PALETTE.length],
  }));

  const total = coloredData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={className}>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              dataKey="value"
              strokeWidth={1}
              stroke="#18181b"
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {coloredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {coloredData.map((entry, index) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
          return (
            <div
              key={index}
              className="flex items-center gap-2"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-zinc-400">
                {entry.name} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
