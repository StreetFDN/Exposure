"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ToastContainer } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
// Breadcrumb helpers
// ---------------------------------------------------------------------------

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((seg, idx) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + parts.slice(0, idx + 1).join("/"),
  }));
}

// ---------------------------------------------------------------------------
// Admin layout
// ---------------------------------------------------------------------------

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { address } = useAccount();

  const breadcrumbs = buildBreadcrumbs(pathname);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          {/* Left: hamburger + breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="hidden sm:block">
              <ol className="flex items-center gap-1.5 text-sm">
                {breadcrumbs.map((crumb, idx) => (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <span className="text-zinc-600">/</span>
                    )}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-zinc-50">
                        {crumb.label}
                      </span>
                    ) : (
                      <span className="text-zinc-400">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Right: admin user info */}
          {address && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-zinc-400 sm:block">
                {truncateAddress(address)}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                {address.slice(2, 4).toUpperCase()}
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
