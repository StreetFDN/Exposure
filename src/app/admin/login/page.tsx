"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-2xl font-light tracking-tight text-zinc-900">
            Admin Access
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Exposure Platform Administration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs uppercase tracking-widest text-zinc-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full border border-zinc-200 bg-transparent px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-center text-sm text-zinc-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>

        <div className="mt-12 text-center">
          <a
            href="/"
            className="text-xs text-zinc-400 transition-colors hover:text-zinc-600"
          >
            Back to Exposure
          </a>
        </div>
      </div>
    </div>
  );
}
