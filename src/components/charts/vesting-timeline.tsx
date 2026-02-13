"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VestingSchedule {
  tgeUnlock: number; // percentage unlocked at TGE
  cliffMonths: number; // months before linear vesting starts
  vestingMonths: number; // total linear vesting duration in months
  totalAmount: number; // total token amount
  claimed: number; // tokens already claimed
}

interface VestingTimelineProps {
  schedule: VestingSchedule;
  className?: string;
}

// ---------------------------------------------------------------------------
// Data builder
// ---------------------------------------------------------------------------

function buildTimelineData(schedule: VestingSchedule) {
  const { tgeUnlock, cliffMonths, vestingMonths, totalAmount } = schedule;
  const tgeAmount = (tgeUnlock / 100) * totalAmount;
  const remaining = totalAmount - tgeAmount;
  const points: { month: number; label: string; unlocked: number; locked: number }[] = [];

  const totalMonths = cliffMonths + vestingMonths;

  for (let m = 0; m <= totalMonths; m++) {
    let unlocked: number;

    if (m === 0) {
      unlocked = tgeAmount;
    } else if (m <= cliffMonths) {
      unlocked = tgeAmount;
    } else {
      const vestedMonths = m - cliffMonths;
      const linearUnlocked = (vestedMonths / vestingMonths) * remaining;
      unlocked = tgeAmount + linearUnlocked;
    }

    unlocked = Math.min(unlocked, totalAmount);

    let label = `M${m}`;
    if (m === 0) label = "TGE";
    else if (m === cliffMonths && cliffMonths > 0) label = `Cliff End`;
    else if (m === totalMonths) label = "Fully Vested";

    points.push({
      month: m,
      label,
      unlocked: Math.round(unlocked),
      locked: Math.round(totalAmount - unlocked),
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: Record<string, any>) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-zinc-300">{label}</p>
      <p className="text-xs text-zinc-400">
        Unlocked:{" "}
        <span className="font-medium text-zinc-200">
          {payload[0]?.value?.toLocaleString()}
        </span>
      </p>
      <p className="text-xs text-zinc-400">
        Locked:{" "}
        <span className="font-medium text-zinc-200">
          {payload[1]?.value?.toLocaleString()}
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VestingTimeline({ schedule, className }: VestingTimelineProps) {
  const data = buildTimelineData(schedule);
  const claimedPercent =
    schedule.totalAmount > 0
      ? ((schedule.claimed / schedule.totalAmount) * 100).toFixed(1)
      : "0";

  return (
    <div className={className}>
      {/* Summary row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
          <span className="block text-xs text-zinc-500">Claimed</span>
          <span className="block font-serif text-lg font-light text-zinc-100">
            {schedule.claimed.toLocaleString()}
          </span>
          <span className="block text-[11px] text-zinc-500">{claimedPercent}%</span>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
          <span className="block text-xs text-zinc-500">Locked</span>
          <span className="block font-serif text-lg font-light text-zinc-100">
            {(schedule.totalAmount - schedule.claimed).toLocaleString()}
          </span>
          <span className="block text-[11px] text-zinc-500">
            {(100 - parseFloat(claimedPercent)).toFixed(1)}%
          </span>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
          <span className="block text-xs text-zinc-500">Total</span>
          <span className="block font-serif text-lg font-light text-zinc-100">
            {schedule.totalAmount.toLocaleString()}
          </span>
          <span className="block text-[11px] text-zinc-500">100%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}K`
                    : `${v}`
              }
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            {schedule.cliffMonths > 0 && (
              <ReferenceLine
                x={`Cliff End`}
                stroke="#52525b"
                strokeDasharray="4 4"
                label={{
                  value: "Cliff End",
                  position: "top",
                  fill: "#71717a",
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="stepAfter"
              dataKey="unlocked"
              stackId="1"
              stroke="#a1a1aa"
              fill="#a1a1aa"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Area
              type="stepAfter"
              dataKey="locked"
              stackId="1"
              stroke="#3f3f46"
              fill="#3f3f46"
              fillOpacity={0.1}
              strokeWidth={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
