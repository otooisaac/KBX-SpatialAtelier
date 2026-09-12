"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const RED = "#910B0A";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        setHasRecoverySession(true);
      } else {
        setError(
          "This password reset link is invalid or has expired. Please request a new password reset email."
        );
      }

      setCheckingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setHasRecoverySession(true);
        setError("");
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Za-z]/.test(password)) {
      setError("Password must contain at least one letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (!hasRecoverySession) {
      setError(
        "Your password reset session is no longer valid. Please request a new reset link."
      );
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(
        "Your password has been successfully updated. You can now sign in with your new password."
      );

      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/client-profile");
      }, 2500);
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        "Something went wrong while updating your password. Please try again."
      );

      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200"
            style={{ borderTopColor: RED }}
          />

          <p className="text-sm text-gray-600">
            Verifying your password reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/kbx-logo.svg"
              alt="KBX Spatial Atelier"
              className="h-16 w-auto"
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Reset your password
            </h1>

            <p className="mt-2 text-sm text-gray-500 leading-6">
              Create a new password for your KBX Spatial Atelier client
              account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700 leading-5">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm text-green-700 leading-5">{success}</p>
            </div>
          )}

          {hasRecoverySession && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#910B0A] focus:ring-1 focus:ring-[#910B0A] disabled:bg-gray-100"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm new password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#910B0A] focus:ring-1 focus:ring-[#910B0A] disabled:bg-gray-100"
                />
              </div>

              {/* Password Requirements */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Password requirements
                </p>

                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• At least 8 characters</li>
                  <li>• At least one letter</li>
                  <li>• At least one number</li>
                </ul>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: RED }}
              >
                {loading ? "Updating password..." : "Update password"}
              </button>
            </form>
          )}

          {/* Invalid / expired link */}
          {!hasRecoverySession && !success && (
            <div className="text-center">
              <Link
                href="/client-profile"
                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white transition"
                style={{ backgroundColor: RED }}
              >
                Return to client login
              </Link>
            </div>
          )}

          {/* Success link */}
          {success && (
            <div className="text-center mt-5">
              <p className="text-xs text-gray-500">
                Redirecting you to the client login...
              </p>

              <Link
                href="/client-profile"
                className="inline-block mt-3 text-sm font-medium hover:underline"
                style={{ color: RED }}
              >
                Go to client login
              </Link>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link
              href="/client-profile"
              className="text-sm text-gray-500 hover:text-gray-900 transition"
            >
              ← Back to client portal
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} KBX Spatial Atelier. All rights
          reserved.
        </p>
      </div>
    </main>
  );
}