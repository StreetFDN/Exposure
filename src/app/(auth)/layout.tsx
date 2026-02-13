import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    template: "%s — Exposure",
    default: "Dashboard — Exposure",
  },
  description:
    "Manage your investments, claims, and staking on the Exposure platform.",
};

// ---------------------------------------------------------------------------
// Authenticated layout — server component wrapping the client-side auth shell.
// ---------------------------------------------------------------------------

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthShell>{children}</AuthShell>;
}
