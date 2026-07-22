"use client";

import { Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { clearStoredSession, login, setStoredSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearStoredSession();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await login(username, password);
      setStoredSession(session.token, session.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-4 border-b border-slate-200 px-7 py-5 sm:px-8">
          <div className="h-14 w-16 shrink-0 overflow-hidden" aria-hidden="true">
            <img
              className="h-full w-auto max-w-none"
              src="/mountain-helicopters-nepal-logo.jpeg"
              alt=""
            />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-snug text-navy">Mountain Helicopters Nepal</div>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-7 sm:p-8">
            <h1 className="text-2xl font-semibold text-navy">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Enter your dashboard credentials.</p>

            <label className="mt-7 block text-sm font-semibold text-slate-700" htmlFor="username">
              Username
            </label>
            <div className="mt-2 flex h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-blue-100">
              <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                id="username"
                className="h-full min-w-0 flex-1 bg-transparent outline-none"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <div className="mt-2 flex h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-blue-100">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                id="password"
                className="h-full min-w-0 flex-1 bg-transparent outline-none"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="grid h-8 w-8 shrink-0 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-navy px-4 font-semibold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
