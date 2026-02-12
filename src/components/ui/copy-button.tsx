"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The text to copy to clipboard */
  text: string;
  /** Duration to show the success state (ms) */
  successDuration?: number;
}

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ className, text, successDuration = 2000, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, successDuration);
      } catch {
        // Clipboard API can fail in insecure contexts; fail silently
      }
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className={cn(
          "inline-flex items-center justify-center rounded-md p-2 text-zinc-400 transition-colors duration-150",
          "hover:bg-zinc-800 hover:text-zinc-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          copied && "text-emerald-400 hover:text-emerald-300",
          className
        )}
        {...props}
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    );
  }
);

CopyButton.displayName = "CopyButton";

export { CopyButton };
