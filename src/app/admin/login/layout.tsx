export default function AdminLoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Override the admin sidebar layout — login page gets a plain wrapper
  return <>{children}</>;
}
