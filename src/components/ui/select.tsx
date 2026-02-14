"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "children"
  > {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      placeholder,
      options,
      id: idProp,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : null, helperText ? helperId : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={cn(
              "h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-10 text-sm text-zinc-900",
              "outline-none transition-colors duration-150",
              error
                ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30"
                : "border-zinc-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-rose-500" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-zinc-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
