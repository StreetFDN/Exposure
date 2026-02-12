"use client";

import { useAccount } from "wagmi";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConnectPrompt } from "@/components/layout/connect-prompt";

// ---------------------------------------------------------------------------
// Authenticated layout — shows connect prompt if wallet is not connected.
// ---------------------------------------------------------------------------

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isConnected } = useAccount();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {isConnected ? children : <ConnectPrompt />}
      </main>
      <Footer />
    </div>
  );
}
