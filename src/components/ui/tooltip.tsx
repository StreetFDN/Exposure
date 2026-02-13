"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** The content shown inside the tooltip */
  content: React.ReactNode;
  /** Position relative to the trigger element */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delayMs?: number;
  /** The trigger element */
  children: React.ReactElement;
  className?: string;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-zinc-800 border-x-transparent border-b-transparent border-4",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-b-zinc-800 border-x-transparent border-t-transparent border-4",
  left: "left-full top-1/2 -translate-y-1/2 border-l-zinc-800 border-y-transparent border-r-transparent border-4",
  right:
    "right-full top-1/2 -translate-y-1/2 border-r-zinc-800 border-y-transparent border-l-transparent border-4",
};

function Tooltip({
  content,
  position = "top",
  delayMs = 200,
  children,
  className,
}: TooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = React.useId();

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delayMs);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children, {
        "aria-describedby": visible ? tooltipId : undefined,
      } as React.HTMLAttributes<HTMLElement>)}

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 shadow-lg",
            "pointer-events-none animate-in fade-in-0 zoom-in-95",
            positionClasses[position],
            className
          )}
        >
          {content}
          <span
            className={cn("absolute", arrowClasses[position])}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

Tooltip.displayName = "Tooltip";

export { Tooltip };
