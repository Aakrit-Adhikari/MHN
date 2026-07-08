"use client";

import { Lock, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL, clearStoredSession, login, setStoredSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card md:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-navy-deep p-8 text-white md:p-10">
          <div className="brand-logo">
            <div className="brand-mark">M</div>
            <div>
              <div className="brand-text">Mountain Helicopters</div>
              <div className="brand-sub">Admin · Nepal</div>
            </div>
          </div>
          <div className="max-w-md py-16">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
              Premium Operations
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight">
              Custom control room for MHN tours, content, and inquiries.
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Sign in with your backend admin account. This panel uses live API data from the existing MHN backend.
            </p>
          </div>
          <p className="text-xs text-white/45">NEXT_PUBLIC_API_BASE_URL={API_BASE_URL}</p>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <form className="w-full max-w-sm" onSubmit={onSubmit}>
            <h2 className="font-serif text-3xl font-semibold text-navy">Admin Login</h2>
            <p className="mt-2 text-sm text-slate-600">Use your admin username and password.</p>

            <label className="mt-8 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Username
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-navy focus-within:ring-4 focus-within:ring-blue-100">
              <UserRound className="h-4 w-4 text-slate-400" />
              <input
                className="h-11 w-full outline-none"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-navy focus-within:ring-4 focus-within:ring-blue-100">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                className="h-11 w-full outline-none"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <button className="btn btn-gold mt-6 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
