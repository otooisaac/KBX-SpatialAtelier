"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase-browser";

const RED = "#910B0A";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { error: loginError } =
        await supabaseBrowser.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw new Error(
          loginError.message || "Invalid email or password."
        );
      }

      router.replace("/admin/project");
      router.refresh();
    } catch (err) {
      console.error("Admin login failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 py-10 text-black">
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p
              className="text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: RED }}
            >
              KBX Spatial Atelier
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Admin Login
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/50">
              Sign in to access the KBX Spatial Atelier project management
              system.
            </p>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                >
                  Email
                </label>

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-black/[0.03]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-black/55"
                >
                  Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-black/15 bg-white px-4 py-4 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-black/[0.03]"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full rounded-full px-6 py-4 text-sm font-bold tracking-[0.08em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: RED }}
              >
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-black/35">
            Authorized KBX Spatial Atelier administration only.
          </p>
        </div>
      </div>
    </main>
  );
}