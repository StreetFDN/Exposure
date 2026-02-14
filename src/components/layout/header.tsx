"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: "/deals", label: "Deals" },
  { href: "/groups", label: "Groups" },
  { href: "/about", label: "About" },
] as const;

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function Header() {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for subtle border enhancement
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header
      className={`fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl transition-colors duration-300 ${
        scrolled ? "border-b border-zinc-200" : "border-b border-transparent"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-6 lg:px-12">
        {/* ---- Brand ---- */}
        <Link
          href="/"
          className="font-serif text-lg font-light tracking-tight text-zinc-900 transition-opacity hover:opacity-80"
        >
          Exposure
        </Link>

        {/* ---- Desktop nav (center) ---- */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-normal transition-colors duration-200 ${
                  isActive
                    ? "text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ---- Right section ---- */}
        <div className="flex items-center gap-4">
          {/* Wallet / Launch App */}
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
                  className="hidden md:block"
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
                          className="border border-zinc-300 px-5 py-2 text-sm font-normal text-zinc-700 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          Launch App
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-normal text-rose-600 transition-colors hover:bg-rose-100"
                        >
                          Wrong Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="flex items-center gap-2 border border-zinc-200 px-3 py-2 text-sm font-normal text-zinc-500 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-700"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain"}
                              src={chain.iconUrl}
                              className="h-3.5 w-3.5 rounded-full"
                            />
                          )}
                          <span className="hidden lg:inline">{chain.name}</span>
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="flex items-center gap-2.5 border border-zinc-200 px-3 py-2 text-sm font-normal text-zinc-500 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-700"
                        >
                          {/* Avatar placeholder */}
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-normal text-zinc-500">
                            {account.address?.slice(2, 4).toUpperCase()}
                          </div>
                          <span className="font-mono text-xs">
                            {account.displayName}
                          </span>
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
            className="p-2 text-zinc-500 transition-colors hover:text-zinc-900 md:hidden"
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

      {/* ---- Mobile slide-out panel ---- */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-80 flex-col border-l border-zinc-200 bg-white md:hidden">
            <nav className="flex flex-1 flex-col gap-0 p-6">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`border-b border-zinc-100 py-4 text-sm font-normal tracking-wide transition-colors ${
                      isActive
                        ? "text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile auth section */}
              <div className="mt-8">
                {isConnected && address ? (
                  <div className="flex items-center gap-3 border border-zinc-200 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-500">
                      {address.slice(2, 4).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-mono text-xs text-zinc-600">
                        {truncateAddress(address)}
                      </p>
                      <p className="text-[10px] text-zinc-400">Connected</p>
                    </div>
                  </div>
                ) : (
                  <ConnectButton.Custom>
                    {({ openConnectModal, mounted }) => (
                      <div
                        {...(!mounted && {
                          "aria-hidden": true,
                          style: {
                            opacity: 0,
                            pointerEvents: "none" as const,
                            userSelect: "none" as const,
                          },
                        })}
                      >
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="w-full border border-zinc-300 px-5 py-3 text-sm font-normal text-zinc-700 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          Launch App
                        </button>
                      </div>
                    )}
                  </ConnectButton.Custom>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
