"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ToastContainer } from "@/components/ui/toast";

/* -------------------------------------------------------------------------- */
/*  Breadcrumb helpers                                                         */
/* -------------------------------------------------------------------------- */

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((seg, idx) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + parts.slice(0, idx + 1).join("/"),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Admin layout                                                               */
/* -------------------------------------------------------------------------- */

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { address } = useAccount();

  // Login page gets no sidebar -- render children directly
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const breadcrumbs = buildBreadcrumbs(pathname);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          {/* Left: hamburger + breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded p-1.5 text-zinc-400 transition-colors hover:text-zinc-700 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="hidden sm:block">
              <ol className="flex items-center gap-1.5 text-sm font-normal">
                {breadcrumbs.map((crumb, idx) => (
                  <li key={crumb.href} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <span className="text-zinc-300">/</span>
                    )}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="text-zinc-700">
                        {crumb.label}
                      </span>
                    ) : (
                      <span className="text-zinc-500">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Right: admin user info */}
          {address && (
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-xs font-normal text-zinc-500 sm:block">
                {truncateAddress(address)}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-[10px] text-zinc-500">
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
