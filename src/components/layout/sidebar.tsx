"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Shield,
  Wallet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const SIDEBAR_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/deals", label: "Deals", icon: Briefcase },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/compliance", label: "Compliance", icon: Shield },
  { href: "/admin/treasury", label: "Treasury", icon: Wallet },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface SidebarProps {
  /** Controlled open state for mobile drawer */
  mobileOpen?: boolean;
  /** Callback to close mobile drawer */
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { address } = useAccount();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // ---- Sidebar content (shared between desktop and mobile) ----
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800/60 px-4">
        <Link href="/admin" className="flex items-center gap-2">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-zinc-50">
              EXPOSURE
            </span>
          )}
          {collapsed && (
            <span className="text-lg font-bold text-violet-400">E</span>
          )}
        </Link>

        {/* Collapse toggle (desktop only) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-md p-1 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50 lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {SIDEBAR_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-500/10 text-violet-400"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {address && (
        <div className="border-t border-zinc-800/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
              {address.slice(2, 4).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {truncateAddress(address)}
                </p>
                <span className="inline-block rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                  Admin
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ---- Desktop sidebar ---- */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-zinc-800/60 bg-zinc-950 transition-[width] lg:block ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ---- Mobile drawer ---- */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-800/60 bg-zinc-950 lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
