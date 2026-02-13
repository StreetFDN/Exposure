import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <img
        src="/street-logo2.png"
        alt="Exposure"
        className="mb-8 h-10 opacity-60"
      />

      <h1 className="font-[family-name:var(--font-playfair)] text-8xl font-bold tracking-tight text-zinc-50 sm:text-9xl">
        404
      </h1>

      <p className="mt-4 text-lg font-light text-zinc-400">
        Page not found
      </p>

      <p className="mt-2 max-w-md text-sm text-zinc-500">
        The page you are looking for does not exist or has been moved.
      </p>

      <Link
        href="/"
        className="btn-premium mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold text-white"
      >
        Go Home
      </Link>
    </div>
  );
}
