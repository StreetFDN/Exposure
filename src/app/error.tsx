"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center page-enter">
      <div className="mb-16 h-px w-12 bg-zinc-200" />

      <h1 className="font-serif text-2xl font-light tracking-tight text-zinc-800">
        Something went wrong
      </h1>

      <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
        An unexpected error occurred. Please try again, or return to the
        homepage if the problem persists.
      </p>

      {process.env.NODE_ENV === "development" && error.message && (
        <pre className="mt-8 max-w-lg overflow-auto rounded border border-zinc-200 bg-zinc-50 p-4 text-left text-xs text-zinc-500">
          {error.message}
          {error.digest && (
            <>
              {"\n"}Digest: {error.digest}
            </>
          )}
        </pre>
      )}

      <div className="mt-10 flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-zinc-400 hover:text-zinc-900"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-700"
        >
          Return home
        </Link>
      </div>

      <div className="mt-16 h-px w-12 bg-zinc-200" />
    </div>
  );
}
