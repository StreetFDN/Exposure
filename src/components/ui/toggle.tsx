"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const toggleVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-sm transition-transform duration-200",
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5",
        md: "h-4.5 w-4.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">,
    VariantProps<typeof toggleVariants> {
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked state for uncontrolled usage */
  defaultChecked?: boolean;
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible label */
  label?: string;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      size,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      label,
      disabled,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;

    const [uncontrolled, setUncontrolled] = React.useState(defaultChecked);
    const isChecked = controlledChecked ?? uncontrolled;

    const handleClick = () => {
      if (disabled) return;
      const next = !isChecked;
      if (controlledChecked === undefined) {
        setUncontrolled(next);
      }
      onCheckedChange?.(next);
    };

    const thumbOffset: Record<string, { on: string; off: string }> = {
      sm: { on: "translate-x-[1.125rem]", off: "translate-x-[0.1875rem]" },
      md: { on: "translate-x-[1.375rem]", off: "translate-x-[0.1875rem]" },
    };

    const sizeKey = size ?? "md";

    return (
      <div className="inline-flex items-center gap-2">
        <button
          ref={ref}
          id={id}
          type="button"
          role="switch"
          aria-checked={isChecked}
          aria-label={label}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            toggleVariants({ size }),
            isChecked ? "bg-violet-600" : "bg-zinc-300",
            className
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              thumbVariants({ size }),
              "mt-[0.1875rem]",
              isChecked ? thumbOffset[sizeKey].on : thumbOffset[sizeKey].off
            )}
          />
        </button>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "cursor-pointer text-sm text-zinc-700",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };
