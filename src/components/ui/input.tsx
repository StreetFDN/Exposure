"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
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
          <label
            htmlFor={id}
            className="text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center rounded-lg border bg-zinc-900 transition-colors duration-150",
            error
              ? "border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/30"
              : "border-zinc-700 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {leftAddon && (
            <span className="flex shrink-0 items-center pl-3 text-sm text-zinc-400">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type={type}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              [error ? errorId : null, helperText ? helperId : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={cn(
              "h-10 w-full bg-transparent px-3 text-sm text-zinc-50 placeholder:text-zinc-500",
              "outline-none",
              "disabled:cursor-not-allowed",
              leftAddon && "pl-1.5",
              rightAddon && "pr-1.5",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <span className="flex shrink-0 items-center pr-3 text-sm text-zinc-400">
              {rightAddon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-rose-400" role="alert">
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

Input.displayName = "Input";

export { Input };
