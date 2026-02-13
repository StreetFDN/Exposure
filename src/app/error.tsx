"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <img
        src="/street-logo2.png"
        alt="Exposure"
        className="mb-8 h-10 opacity-60"
      />

      <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-bold tracking-tight text-zinc-50 sm:text-7xl">
        500
      </h1>

      <p className="mt-4 text-lg font-light text-zinc-400">
        Something went wrong
      </p>

      <p className="mt-2 max-w-md text-sm text-zinc-500">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>

      {process.env.NODE_ENV === "development" && (
        <pre className="mt-6 max-w-lg overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left text-xs text-rose-400">
          {error.message}
          {error.digest && (
            <>
              {"\n"}Digest: {error.digest}
            </>
          )}
        </pre>
      )}

      <button
        onClick={reset}
        className="btn-premium mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
