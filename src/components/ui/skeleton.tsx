import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const skeletonVariants = cva("animate-pulse bg-zinc-800", {
  variants: {
    variant: {
      text: "h-4 w-full rounded",
      circle: "rounded-full",
      card: "h-40 w-full rounded-xl",
      rect: "rounded-lg",
    },
  },
  defaultVariants: {
    variant: "text",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Width — accepts any CSS value. Defaults depend on variant. */
  width?: string | number;
  /** Height — accepts any CSS value. Defaults depend on variant. */
  height?: string | number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, style, ...props }, ref) => {
    const sizeDefaults: Record<string, { width?: string; height?: string }> = {
      circle: { width: "2.5rem", height: "2.5rem" },
      rect: { width: "100%", height: "4rem" },
    };

    const defaults = variant ? sizeDefaults[variant] ?? {} : {};

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(skeletonVariants({ variant, className }))}
        style={{
          width: width ?? defaults.width,
          height: height ?? defaults.height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
