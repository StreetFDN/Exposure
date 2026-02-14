import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center page-enter">
      <div className="mb-16 h-px w-12 bg-zinc-200" />

      <h1 className="font-serif text-8xl font-light tracking-tight text-zinc-200">
        404
      </h1>

      <p className="mt-6 font-serif text-xl font-light text-zinc-600">
        Page not found
      </p>

      <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
        The page you are looking for does not exist, or has been moved to a
        different location.
      </p>

      <Link
        href="/"
        className="mt-10 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        Return home
      </Link>

      <div className="mt-16 h-px w-12 bg-zinc-200" />
    </div>
  );
}
