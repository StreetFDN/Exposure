"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

interface DropdownContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown compound components must be used within <Dropdown>.");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Dropdown                                                                  */
/* -------------------------------------------------------------------------- */

export interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close }}>
      <div ref={containerRef} className={cn("relative inline-block", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  DropdownTrigger                                                           */
/* -------------------------------------------------------------------------- */

export interface DropdownTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { toggle, isOpen } = useDropdownContext();

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn("outline-none", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownTrigger.displayName = "DropdownTrigger";

/* -------------------------------------------------------------------------- */
/*  DropdownMenu                                                              */
/* -------------------------------------------------------------------------- */

export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alignment relative to trigger */
  align?: "left" | "right";
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, align = "left", children, ...props }, ref) => {
    const { isOpen } = useDropdownContext();

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        role="menu"
        className={cn(
          "absolute z-50 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-xl",
          "animate-in fade-in-0 zoom-in-95",
          align === "right" ? "right-0" : "left-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenu.displayName = "DropdownMenu";

/* -------------------------------------------------------------------------- */
/*  DropdownItem                                                              */
/* -------------------------------------------------------------------------- */

export interface DropdownItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, icon, children, disabled, onClick, ...props }, ref) => {
    const { close } = useDropdownContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
      close();
    };

    return (
      <button
        ref={ref}
        role="menuitem"
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-700 transition-colors",
          "outline-none focus-visible:bg-zinc-100",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-zinc-100 hover:text-zinc-900",
          className
        )}
        {...props}
      >
        {icon && (
          <span className="shrink-0 text-zinc-400" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
      </button>
    );
  }
);
DropdownItem.displayName = "DropdownItem";

/* -------------------------------------------------------------------------- */
/*  DropdownSeparator                                                         */
/* -------------------------------------------------------------------------- */

function DropdownSeparator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-zinc-200", className)}
    />
  );
}
DropdownSeparator.displayName = "DropdownSeparator";

export {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
};
