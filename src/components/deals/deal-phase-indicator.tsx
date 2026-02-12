"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Phase {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: "completed" | "active" | "upcoming";
}

export interface DealPhaseIndicatorProps {
  phases: Phase[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealPhaseIndicator({
  phases,
  className,
}: DealPhaseIndicatorProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Desktop: horizontal stepper */}
      <div className="hidden items-start md:flex">
        {phases.map((phase, i) => (
          <React.Fragment key={phase.id}>
            {/* Step */}
            <div className="flex flex-1 flex-col items-center gap-2">
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  phase.status === "completed" &&
                    "border-violet-500 bg-violet-500 text-white",
                  phase.status === "active" &&
                    "border-violet-500 bg-violet-500/20 text-violet-400",
                  phase.status === "upcoming" &&
                    "border-zinc-700 bg-zinc-800 text-zinc-500"
                )}
              >
                {phase.status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="flex flex-col items-center gap-0.5 text-center">
                <span
                  className={cn(
                    "text-xs font-medium",
                    phase.status === "active"
                      ? "text-violet-400"
                      : phase.status === "completed"
                        ? "text-zinc-300"
                        : "text-zinc-500"
                  )}
                >
                  {phase.name}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {formatDate(phase.startsAt)}
                </span>
              </div>
            </div>

            {/* Connector line */}
            {i < phases.length - 1 && (
              <div className="mt-4 flex h-0.5 flex-1 items-center">
                <div
                  className={cn(
                    "h-full w-full rounded-full",
                    phase.status === "completed"
                      ? "bg-violet-500"
                      : "bg-zinc-700"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="flex flex-col gap-0 md:hidden">
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex gap-3">
            {/* Left rail */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  phase.status === "completed" &&
                    "border-violet-500 bg-violet-500 text-white",
                  phase.status === "active" &&
                    "border-violet-500 bg-violet-500/20 text-violet-400",
                  phase.status === "upcoming" &&
                    "border-zinc-700 bg-zinc-800 text-zinc-500"
                )}
              >
                {phase.status === "completed" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              {i < phases.length - 1 && (
                <div
                  className={cn(
                    "my-1 w-0.5 flex-1",
                    phase.status === "completed"
                      ? "bg-violet-500"
                      : "bg-zinc-700"
                  )}
                />
              )}
            </div>

            {/* Right content */}
            <div className="flex flex-col pb-4">
              <span
                className={cn(
                  "text-sm font-medium",
                  phase.status === "active"
                    ? "text-violet-400"
                    : phase.status === "completed"
                      ? "text-zinc-300"
                      : "text-zinc-500"
                )}
              >
                {phase.name}
              </span>
              <span className="text-xs text-zinc-600">
                {formatDate(phase.startsAt)} - {formatDate(phase.endsAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
