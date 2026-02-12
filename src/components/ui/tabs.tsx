"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs compound components must be used within <Tabs>.");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Tabs                                                                      */
/* -------------------------------------------------------------------------- */

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

  const activeTab = controlledValue ?? uncontrolledValue;

  const setActiveTab = React.useCallback(
    (val: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(val);
      }
      onValueChange?.(val);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  TabsList                                                                  */
/* -------------------------------------------------------------------------- */

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "flex items-center gap-0 border-b border-zinc-800",
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

/* -------------------------------------------------------------------------- */
/*  TabsTrigger                                                               */
/* -------------------------------------------------------------------------- */

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        id={`tab-${value}`}
        tabIndex={isActive ? 0 : -1}
        onClick={() => setActiveTab(value)}
        className={cn(
          "relative px-4 py-2.5 text-sm font-medium transition-colors duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset rounded-t-md",
          isActive
            ? "text-zinc-50"
            : "text-zinc-500 hover:text-zinc-300",
          className
        )}
        {...props}
      >
        {children}
        {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

/* -------------------------------------------------------------------------- */
/*  TabsContent                                                               */
/* -------------------------------------------------------------------------- */

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeTab } = useTabsContext();

    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        tabIndex={0}
        className={cn("outline-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
