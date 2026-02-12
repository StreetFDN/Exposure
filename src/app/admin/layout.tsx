import { AdminLayout } from "@/components/layout/admin-layout";

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
