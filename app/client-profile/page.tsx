"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const RED = "#910B0A";

const CLIENT_ACCOUNTS_KEY = "kbxClientAccounts";
const CURRENT_CLIENT_KEY = "kbxCurrentClientId";
const LEGACY_CLIENT_KEY = "kbxClient";

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  createdAt?: string;
};

function generateClientId() {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAccounts(): ClientAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(CLIENT_ACCOUNTS_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: ClientAccount[]) {
  localStorage.setItem(CLIENT_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export default function ClientProfilePage() {
  const [mode, setMode] = useState<"create" | "login">("create");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error"
  );

  const [loading, setLoading] = useState(false);

  function showError(text: string) {
    setMessageType("error");
    setMessage(text);
  }

  function showSuccess(text: string) {
    setMessageType("success");
    setMessage(text);
  }

  function handleCreateAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedContact = contact.trim();

    if (!trimmedName) {
      showError("Please enter your full name.");
      return;
    }

    if (!trimmedEmail) {
      showError("Please enter your email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      showError("Please enter a valid email address.");
      return;
    }

    if (!trimmedContact) {
      showError("Please enter your WhatsApp or contact number.");
      return;
    }

    if (!password) {
      showError("Please create a password.");
      return;
    }

    if (password.length < 8) {
      showError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      showError("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const accounts = getAccounts();

      const existingAccount = accounts.find(
        (account) => account.email.toLowerCase() === trimmedEmail
      );

      if (existingAccount) {
        showError(
          "An account with this email already exists. Please log in instead."
        );
        setLoading(false);
        return;
      }

      const newClient: ClientAccount = {
        id: generateClientId(),
        name: trimmedName,
        email: trimmedEmail,
        contact: trimmedContact,
        password,
        createdAt: new Date().toISOString(),
      };

      const updatedAccounts = [...accounts, newClient];

      saveAccounts(updatedAccounts);

      localStorage.setItem(CURRENT_CLIENT_KEY, newClient.id);

      /*
       * Keep the legacy client object as well so existing pages
       * that still read kbxClient continue to work.
       */
      localStorage.setItem(
        LEGACY_CLIENT_KEY,
        JSON.stringify({
          id: newClient.id,
          name: newClient.name,
          email: newClient.email,
          contact: newClient.contact,
        })
      );

      showSuccess("Your client profile has been created.");

      window.location.href = "/client-portal";
    } catch {
      showError(
        "Something went wrong while creating your profile. Please try again."
      );
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    const trimmedEmail = loginEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      showError("Please enter your email address.");
      return;
    }

    if (!loginPassword) {
      showError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const accounts = getAccounts();

      const account = accounts.find(
        (item) =>
          item.email.toLowerCase() === trimmedEmail &&
          item.password === loginPassword
      );

      if (!account) {
        showError("Incorrect email or password.");
        setLoading(false);
        return;
      }

      localStorage.setItem(CURRENT_CLIENT_KEY, account.id);

      localStorage.setItem(
        LEGACY_CLIENT_KEY,
        JSON.stringify({
          id: account.id,
          name: account.name,
          email: account.email,
          contact: account.contact,
        })
      );

      showSuccess("Login successful.");

      window.location.href = "/client-portal";
    } catch {
      showError("Something went wrong while logging in. Please try again.");
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    showError(
      "Password recovery will be available when production authentication is connected."
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[100px] max-w-[1400px] items-center justify-between px-5 md:px-8">
          {/* LOGO + BRAND */}
          <Link href="/" className="flex items-center">
            <div className="relative h-[64px] w-[130px] shrink-0 sm:h-[70px] sm:w-[140px]">
              <Image
                src="/kbx-logo.svg"
                alt="KBX Spatial Atelier"
                fill
                priority
                sizes="140px"
                className="object-contain object-left"
              />
            </div>

            <div className="ml-2 hidden sm:block leading-none">
              <p className="text-sm font-semibold tracking-tight">
                KBX Spatial Atelier
              </p>

              <p className="mt-[6px] text-[10px] uppercase tracking-[0.2em] text-black/45">
                Client Portal
              </p>
            </div>
          </Link>

          {/* BACK TO WEBSITE */}
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-black/30"
          >
            ← Back to Website
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <section className="px-5 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
          <div className="grid md:grid-cols-[0.85fr_1.15fr]">
            {/* LEFT PANEL */}
            <div className="relative overflow-hidden bg-black p-8 text-white md:p-10">
              <div
                className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: RED }}
              />

              <div className="relative z-10 flex h-full flex-col">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    Client Portal
                  </p>

                  <h1 className="mt-6 max-w-md text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                    Your project,
                    <br />
                    <span style={{ color: RED }}>beautifully organised.</span>
                  </h1>

                  <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
                    Create your client profile to begin your project journey
                    with KBX Spatial Atelier.
                  </p>
                </div>

                {/* PROCESS */}
                <div className="mt-12 space-y-5">
                  {[
                    [
                      "01",
                      "Create your profile",
                      "Set up your personal client account.",
                    ],
                    [
                      "02",
                      "Tell us about your project",
                      "Complete your digital project brief.",
                    ],
                    [
                      "03",
                      "Begin the design process",
                      "Your project moves into consultation and planning.",
                    ],
                  ].map(([number, title, description]) => (
                    <div
                      key={number}
                      className="flex gap-4 border-t border-white/10 pt-5"
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: RED }}
                      >
                        {number}
                      </span>

                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/40">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto hidden pt-12 md:block">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                    Interior Design • Architecture • Bespoke Space
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="p-7 md:p-10">
              {/* MODE SWITCH */}
              <div className="mb-8 flex rounded-full border border-black/10 bg-[#f7f7f5] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("create");
                    setMessage("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    mode === "create"
                      ? "bg-black text-white"
                      : "text-black/45 hover:text-black"
                  }`}
                >
                  Create Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    mode === "login"
                      ? "bg-black text-white"
                      : "text-black/45 hover:text-black"
                  }`}
                >
                  Log In
                </button>
              </div>

              {/* TITLE */}
              <div className="mb-7">
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: RED }}
                >
                  {mode === "create" ? "New Client" : "Welcome Back"}
                </p>

                <h2 className="text-2xl font-semibold tracking-tight">
                  {mode === "create"
                    ? "Create your client profile"
                    : "Log in to your profile"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/45">
                  {mode === "create"
                    ? "Your profile allows you to manage your projects and complete project briefs."
                    : "Access your KBX Spatial Atelier client portal."}
                </p>
              </div>

              {/* MESSAGE */}
              {message && (
                <div
                  className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                    messageType === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* CREATE PROFILE FORM */}
              {mode === "create" && (
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/65">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/65">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/65">
                      WhatsApp / Contact Number
                    </label>

                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+233 ..."
                      autoComplete="tel"
                      className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/65">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-black/40 hover:text-black"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    <p className="mt-1.5 text-[11px] leading-5 text-black/35">
                      Minimum 8 characters, including at least one letter and
                      one number.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/65">
                      Confirm Password
                    </label>

                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-black/40 hover:text-black"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: RED }}
                    >
                      {loading ? "Creating Profile..." : "Create Client Profile →"}
                    </button>
                  </div>

                  <p className="pt-2 text-center text-[11px] leading-5 text-black/35">
                    By creating a profile, you can continue to your KBX
                    project portal and complete your project brief.
                  </p>
                </form>
              )}

              {/* LOGIN FORM */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-black/65">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-xs font-medium text-black/65">
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[11px] font-medium text-black/40 transition hover:text-black"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-black/30 focus:border-black/30"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowLoginPassword(!showLoginPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-black/40 hover:text-black"
                      >
                        {showLoginPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: RED }}
                    >
                      {loading ? "Logging In..." : "Log In →"}
                    </button>
                  </div>

                  <div className="border-t border-black/10 pt-6 text-center">
                    <p className="text-xs text-black/40">
                      Don&apos;t have a client profile yet?
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("create");
                        setMessage("");
                      }}
                      className="mt-2 text-xs font-semibold transition hover:opacity-70"
                      style={{ color: RED }}
                    >
                      Create your profile →
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/10 bg-white px-5 py-8 md:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            {/* FOOTER BRAND */}
            <div>
              <div className="flex items-center">
                <div className="relative h-[48px] w-[100px] shrink-0 sm:h-[52px] sm:w-[105px]">
                  <Image
                    src="/kbx-logo.svg"
                    alt="KBX Spatial Atelier"
                    fill
                    sizes="105px"
                    className="object-contain object-left"
                  />
                </div>

                <div className="ml-2 leading-none">
                  <p className="text-sm font-semibold">
                    KBX Spatial Atelier
                  </p>

                  <p className="mt-[5px] text-[10px] uppercase tracking-[0.18em] text-black/40">
                    Interior Design • Architecture • Bespoke Space
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-xs leading-5 text-black/40">
                Creating thoughtful, sophisticated environments through
                design, architecture and bespoke spatial solutions.
              </p>
            </div>

            {/* FOOTER LINKS */}
            <div className="flex flex-wrap gap-5 text-xs text-black/50">
              <Link
                href="/"
                className="transition hover:text-black"
              >
                Website ↗
              </Link>

              <Link
                href="/client-portal"
                className="transition hover:text-black"
              >
                Client Portal ↗
              </Link>

              <a
                href="tel:+233558167009"
                className="transition hover:text-black"
              >
                +233 558 167 009
              </a>

              <a
                href="tel:+233209468411"
                className="transition hover:text-black"
              >
                +233 209 468 411
              </a>
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="mt-8 border-t border-black/10 pt-5">
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.15em] text-black/30 sm:flex-row sm:justify-between">
              <span>© 2026 KBX Spatial Atelier</span>
              <span>Designed with intention.</span>
            </div>

            <p className="mt-4 text-center text-[9px] text-black/25">
              Website developed by Isaac Otoo, CEO of KBX Spatial Atelier.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}