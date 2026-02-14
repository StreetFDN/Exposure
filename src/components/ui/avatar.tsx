"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  /** Image URL */
  src?: string | null;
  /** Alt text for image / used to derive initials */
  alt?: string;
  /** Whether to show a ring around the avatar */
  ring?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, src, alt = "", ring = false, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);
    const showImage = src && !imgError;

    return (
      <span
        ref={ref}
        role="img"
        aria-label={alt || "Avatar"}
        className={cn(
          avatarVariants({ size }),
          ring && "ring-2 ring-violet-500 ring-offset-2 ring-offset-white",
          className
        )}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-medium text-zinc-600" aria-hidden="true">
            {alt ? getInitials(alt) : "?"}
          </span>
        )}
      </span>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
