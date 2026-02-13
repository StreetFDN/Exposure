"use client";

import * as React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Shield, ArrowRight, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
// KYC pending banner — shown when user is logged in but KYC is not approved
// ---------------------------------------------------------------------------

function KycPendingBanner({ status }: { status: string }) {
  const isPending = status === "pending" || status === "submitted";
  const isRejected = status === "rejected";

  if (!isPending && !isRejected) return null;

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {isRejected ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          ) : (
            <Shield className="h-5 w-5 shrink-0 text-amber-400" />
          )}
          <div>
            <p className="text-sm font-medium text-zinc-50">
              {isRejected
                ? "Verification was not approved"
                : "Verification pending"}
            </p>
            <p className="text-xs text-zinc-400">
              {isRejected
                ? "Your KYC submission was not approved. Please re-submit your documents."
                : "Your KYC is under review. Some features may be restricted until verification is complete."}
            </p>
          </div>
        </div>
        <Link href={isRejected ? "/onboarding?step=2" : "/onboarding?step=2"} className="shrink-0">
          <Button
            size="sm"
            variant="outline"
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            {isRejected ? "Re-submit Documents" : "Check Status"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Authenticated shell — shows connect prompt if wallet is not connected.
// Also shows a KYC pending banner when the user has a session but their
// verification is not yet approved.
//
// Extracted as a client component so the (auth) layout can remain a server
// component and export metadata.
// ---------------------------------------------------------------------------

export function AuthShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isConnected } = useAccount();
  const kycStatus = useCookieValue("exposure_kyc_status");

  // Determine if we should show the KYC banner
  const showKycBanner =
    isConnected &&
    kycStatus !== null &&
    kycStatus !== "approved";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {showKycBanner && <KycPendingBanner status={kycStatus} />}
      <main className="flex-1">
        {isConnected ? children : <ConnectPrompt />}
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
