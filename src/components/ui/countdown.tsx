"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Target date/time to count down to */
  targetDate: Date | string | number;
  /** Label shown above the countdown */
  label?: string;
  /** Callback when countdown reaches zero */
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const Countdown = React.forwardRef<HTMLDivElement, CountdownProps>(
  ({ className, targetDate, label, onComplete, ...props }, ref) => {
    const target = React.useMemo(
      () => new Date(targetDate),
      [targetDate]
    );

    const [timeLeft, setTimeLeft] = React.useState<TimeLeft | null>(() =>
      calcTimeLeft(target)
    );

    const completedRef = React.useRef(false);

    React.useEffect(() => {
      const tick = () => {
        const tl = calcTimeLeft(target);
        setTimeLeft(tl);

        if (!tl && !completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      };

      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }, [target, onComplete]);

    const segments: { label: string; value: string }[] = timeLeft
      ? [
          { label: "Days", value: pad(timeLeft.days) },
          { label: "Hrs", value: pad(timeLeft.hours) },
          { label: "Min", value: pad(timeLeft.minutes) },
          { label: "Sec", value: pad(timeLeft.seconds) },
        ]
      : [];

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-2", className)}
        aria-label={label ?? "Countdown timer"}
        role="timer"
        {...props}
      >
        {label && (
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </span>
        )}

        {timeLeft ? (
          <div className="flex items-center gap-1">
            {segments.map((seg, i) => (
              <React.Fragment key={seg.label}>
                <div className="flex flex-col items-center">
                  <span className="font-mono text-2xl font-bold tabular-nums text-zinc-50">
                    {seg.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {seg.label}
                  </span>
                </div>
                {i < segments.length - 1 && (
                  <span className="mb-3 font-mono text-xl text-zinc-600">
                    :
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <span className="font-mono text-lg font-semibold text-zinc-500">
            Ended
          </span>
        )}
      </div>
    );
  }
);

Countdown.displayName = "Countdown";

export { Countdown };
