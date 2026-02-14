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

/* -------------------------------------------------------------------------- */
/*  Nav config                                                                 */
/* -------------------------------------------------------------------------- */

const SIDEBAR_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/deals", label: "Deals", icon: Briefcase },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/compliance", label: "Compliance", icon: Shield },
  { href: "/admin/treasury", label: "Treasury", icon: Wallet },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

/* -------------------------------------------------------------------------- */
/*  Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

interface SidebarProps {
  mobileOpen?: boolean;
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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
        <Link href="/admin" className="flex items-center">
          {!collapsed ? (
            <span className="font-serif text-lg font-light tracking-wide text-zinc-900">
              Exposure
            </span>
          ) : (
            <span className="font-serif text-lg font-light text-zinc-900">
              E
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded p-1 text-zinc-400 transition-colors hover:text-zinc-700 lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

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
                className={`group relative flex items-center gap-3 rounded-none px-3 py-2 text-sm transition-colors ${
                  active
                    ? "text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
                title={collapsed ? item.label : undefined}
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
                {!collapsed && (
                  <span className="font-normal">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User info */}
      {address && (
        <div className="border-t border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-normal text-zinc-500">
              {address.slice(2, 4).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-normal text-zinc-500">
                  {truncateAddress(address)}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400">
                  Administrator
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-zinc-200 bg-white transition-[width] duration-200 lg:block ${
          collapsed ? "w-[60px]" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
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
