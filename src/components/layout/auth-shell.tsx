"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import {
  LayoutDashboard,
  Briefcase,
  Coins,
  Gift,
  Users,
  Settings,
  Shield,
  ArrowRight,
  AlertTriangle,
  Menu,
  X,
  ChevronRight,
  Award,
} from "lucide-react";
import { ConnectPrompt } from "@/components/layout/connect-prompt";
import { Button } from "@/components/ui/button";
import { ToastContainer } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
// Helper: read a cookie value on the client
// ---------------------------------------------------------------------------

function useCookieValue(name: string): string | null {
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const match = cookies.find((c) => c.startsWith(name + "="));
    if (match) {
      setValue(match.split("=").slice(1).join("="));
    }
  }, [name]);

  return value;
}

// ---------------------------------------------------------------------------
// Sidebar nav config
// ---------------------------------------------------------------------------

const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/staking", label: "Staking", icon: Coins },
  { href: "/claims", label: "Claims", icon: Gift },
  { href: "/referrals", label: "Referrals", icon: Award },
  { href: "/groups", label: "My Groups", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

// ---------------------------------------------------------------------------
// Breadcrumb helper
// ---------------------------------------------------------------------------

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((seg, idx) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: "/" + parts.slice(0, idx + 1).join("/"),
  }));
}

// ---------------------------------------------------------------------------
// KYC pending banner
// ---------------------------------------------------------------------------

function KycPendingBanner({ status }: { status: string }) {
  const isPending = status === "pending" || status === "submitted";
  const isRejected = status === "rejected";

  if (!isPending && !isRejected) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {isRejected ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          ) : (
            <Shield className="h-4 w-4 shrink-0 text-amber-500" />
          )}
          <div>
            <p className="text-sm font-normal text-zinc-800">
              {isRejected
                ? "Verification was not approved"
                : "Verification pending"}
            </p>
            <p className="text-xs font-normal text-zinc-500">
              {isRejected
                ? "Please re-submit your documents."
                : "Some features may be restricted until verification is complete."}
            </p>
          </div>
        </div>
        <Link
          href={isRejected ? "/onboarding?step=2" : "/onboarding?step=2"}
          className="shrink-0"
        >
          <Button
            size="sm"
            variant="outline"
            rightIcon={<ArrowRight className="h-3 w-3" />}
          >
            {isRejected ? "Re-submit" : "Check Status"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

function AuthSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const { address } = useAccount();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand + user greeting */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-5">
        <Link
          href="/dashboard"
          className="font-serif text-lg font-light tracking-tight text-zinc-900"
        >
          Exposure
        </Link>
      </div>

      {/* User info card */}
      {address && (
        <div className="border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-[10px] font-normal text-zinc-500">
              {address.slice(2, 4).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-normal text-zinc-500">
                {truncateAddress(address)}
              </p>
              <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-400">
                Investor
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-0.5">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm font-normal transition-colors duration-150 ${
                  active
                    ? "text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {/* Active indicator -- left border */}
                {active && (
                  <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-violet-500" />
                )}
                <item.icon
                  className={`h-4 w-4 shrink-0 ${
                    active
                      ? "text-zinc-900"
                      : "text-zinc-400 group-hover:text-zinc-600"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom brand */}
      <div className="border-t border-zinc-200 px-5 py-4">
        <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-400">
          Exposure Protocol
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-zinc-200 bg-white lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 border-r border-zinc-200 bg-white lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// AuthShell -- wraps all authenticated pages with sidebar + top bar
// ---------------------------------------------------------------------------

export function AuthShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isConnected, address } = useAccount();
  const kycStatus = useCookieValue("exposure_kyc_status");
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Determine if we should show the KYC banner
  const showKycBanner =
    isConnected && kycStatus !== null && kycStatus !== "approved";

  const breadcrumbs = buildBreadcrumbs(pathname);

  // Not connected -- show full-page connect prompt
  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <ConnectPrompt />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <AuthSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-6 backdrop-blur-sm lg:px-8">
          {/* Left: hamburger + breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 text-zinc-400 transition-colors hover:text-zinc-700 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="hidden sm:block">
              <ol className="flex items-center gap-1.5 text-sm font-normal">
                {breadcrumbs.map((crumb, idx) => (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <ChevronRight className="h-3 w-3 text-zinc-300" />
                    )}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="text-zinc-800">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-zinc-500 transition-colors hover:text-zinc-700"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Right: wallet info */}
          {address && (
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-xs font-normal text-zinc-500 sm:block">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-[10px] text-zinc-500">
                {address.slice(2, 4).toUpperCase()}
              </div>
            </div>
          )}
        </header>

        {/* KYC Banner */}
        {showKycBanner && <KycPendingBanner status={kycStatus} />}

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>

      <ToastContainer />
    </div>
  );
}
