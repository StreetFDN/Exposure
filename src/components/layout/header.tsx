"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bell, Menu, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: "/deals", label: "Deals" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/staking", label: "Staking" },
  { href: "/claims", label: "Claims" },
] as const;

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Placeholder unread count — will be replaced with real data later
  const unreadCount = 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/30 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ---- Logo ---- */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/street-logo2.png"
            alt="Exposure"
            className="h-8"
          />
          <span className="hidden sm:inline-block text-[10px] font-light uppercase tracking-[0.25em] text-zinc-500">
            Exposure
          </span>
        </Link>

        {/* ---- Desktop nav ---- */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            // Only show authenticated links when wallet is connected
            const authOnly =
              link.href === "/portfolio" ||
              link.href === "/staking" ||
              link.href === "/claims";
            if (authOnly && !isConnected) return null;

            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-light tracking-wide transition-colors ${
                  isActive
                    ? "text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ---- Right section ---- */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          {isConnected && (
            <button
              type="button"
              className="relative rounded-md p-2 text-zinc-500 hover:text-zinc-300"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-50 px-1 text-[10px] font-bold text-zinc-900">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Wallet connect — custom render for a cleaner look */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none" as const,
                      userSelect: "none" as const,
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="rounded-md bg-zinc-50 px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="rounded-md border border-rose-800/40 bg-rose-950/30 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950/50"
                        >
                          Wrong Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-2 text-sm font-light text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="h-4 w-4 rounded-full"
                            />
                          )}
                          {chain.name}
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="rounded-md border border-zinc-800 px-3 py-2 text-sm font-light text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                        >
                          {account.displayName}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-zinc-500 hover:text-zinc-300 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ---- Mobile menu drawer (slides from right) ---- */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-72 border-l border-zinc-800 bg-zinc-950 p-6 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const authOnly =
                  link.href === "/portfolio" ||
                  link.href === "/staking" ||
                  link.href === "/claims";
                if (authOnly && !isConnected) return null;

                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-4 py-3 text-sm font-light tracking-wide transition-colors ${
                      isActive
                        ? "text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
