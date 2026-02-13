import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/admin-layout";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    template: "%s — Exposure Admin",
    default: "Admin — Exposure",
  },
  description: "Exposure platform administration panel.",
};

// ---------------------------------------------------------------------------
// Admin route layout — uses the AdminLayout component with sidebar.
// ---------------------------------------------------------------------------

export default function AdminRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayout>{children}</AdminLayout>;
}
