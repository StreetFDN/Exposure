import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    template: "%s — Exposure",
    default: "Exposure — by Street",
  },
  description:
    "Discover and invest in the next generation of crypto projects through trusted lead investors.",
};

// ---------------------------------------------------------------------------
// Public layout — Header + content + Footer
// ---------------------------------------------------------------------------

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
