"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium",
    "transition-colors duration-150 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700",
        secondary:
          "bg-zinc-800 text-zinc-50 hover:bg-zinc-700 active:bg-zinc-800 border border-zinc-700",
        outline:
          "border border-zinc-700 bg-transparent text-zinc-50 hover:bg-zinc-800 active:bg-zinc-900",
        ghost:
          "bg-transparent text-zinc-50 hover:bg-zinc-800 active:bg-zinc-900",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700",
        link: "bg-transparent text-violet-400 underline-offset-4 hover:underline hover:text-violet-300 p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        {children}
        {!isLoading && rightIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
