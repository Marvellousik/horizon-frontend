"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        email,
        password,
      });

      const token = response.data.access || response.data.access_token || null;
      if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("username", response.data.username ?? email);
        setMessage("Login successful. Access token stored.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      } else {
        setMessage("Login succeeded but no token was returned.");
      }
    } catch (error: any) {
      console.log("Full Backend Error:", error.response?.data);
      let errorMessage = "Unable to login. Please check your credentials.";
      if (error.response?.status === 400 && error.response?.data) {
        const fieldErrors = Object.entries(error.response.data)
          .map(
            ([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
          )
          .join("; ");
        errorMessage = `Validation errors: ${fieldErrors}`;
      } else if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
      } else {
        errorMessage = error.message;
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = (role: "STAFF" | "CUSTOMER") => {
    setMessage(null);
    setLoading(true);

    try {
      // Generate simulated base64 JWT payload with authorized role claims
      const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // {"alg":"HS256","typ":"JWT"}
      const payloadObj = {
        sub: role === "STAFF" ? "staff-123" : "customer-123",
        name: role === "STAFF" ? "Emma Staff (Admin)" : "Alex Customer",
        email: role === "STAFF" ? "staff@horizon.com" : "alex@horizon.com",
        role: role,
        role_classification: role,
        user_role: role,
        groups: [role],
        roles: [role],
        iat: Math.floor(Date.now() / 1000)
      };

      const payloadBase64 = window.btoa(JSON.stringify(payloadObj))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const signature = "dummy-signature";
      const mockToken = `${header}.${payloadBase64}.${signature}`;

      // Store in localStorage matching all access points
      localStorage.setItem("accessToken", mockToken);
      localStorage.setItem("access_token", mockToken);
      localStorage.setItem("username", role === "STAFF" ? "Emma Staff" : "Alex Customer");
      localStorage.setItem("role", role);
      localStorage.setItem("userRole", role);

      // Trigger hot-reload on state listeners
      window.dispatchEvent(new Event("storage"));

      setMessage(`Simulated ${role} session login successful! Redirecting...`);
      setTimeout(() => {
        if (role === "STAFF") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }, 800);
    } catch (e) {
      console.error(e);
      setMessage("Failed to trigger simulated mock session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        {/* Editorial Brand Aside */}
        <aside className="flex flex-1 flex-col justify-center bg-background-dim px-8 py-12 text-text-secondary lg:px-16 lg:py-20 border-r border-border-sand/40">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
            <div className="rounded-xl bg-surface p-8 shadow-subtle border border-border-sand/50">
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold font-sans">
                Horizon Inclusion
              </p>
              <h1 className="mt-6 text-5xl md:text-6xl font-serif font-bold italic leading-tight tracking-tight text-text-primary">
                Growing together.
              </h1>
              <p className="mt-6 text-base leading-relaxed text-text-secondary font-sans">
                Welcome back to Horizon Inclusion. We&apos;re here to help you
                navigate your financial journey with empathy, clarity, and
                trusted community support.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="rounded-xl border border-border-sand/80 bg-surface p-8 shadow-subtle">
                <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold font-sans">
                  Account overview
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-background p-5 border border-border-sand/30">
                    <p className="text-sm text-text-secondary font-sans">Secure access</p>
                    <p className="mt-2 text-2xl font-serif font-bold text-text-primary">
                      256-bit
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-5 border border-border-sand/30">
                    <p className="text-sm text-text-secondary font-sans">Trusted login</p>
                    <p className="mt-2 text-2xl font-serif font-bold text-text-primary">
                      24/7
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-dashed border-border-sand bg-surface/40 p-8">
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                    ✓
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-text-secondary font-semibold">
                    Empathy & Trust
                  </p>
                  <p className="max-w-xs text-xs leading-relaxed text-text-secondary font-sans">
                    A financial system built for human connection. We value community, wellness, and mutual growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Clean Minimal Login Area */}
        <main className="flex flex-1 items-center justify-center px-6 py-10 lg:px-14 lg:py-16 bg-background">
          <div className="w-full max-w-[32rem] rounded-xl bg-surface p-8 sm:p-10 border border-border-sand shadow-subtle">
            <div className="mb-8 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary font-sans">
                Welcome back
              </p>
              <h2 className="text-3xl font-serif font-bold text-text-primary">
                Sign in to your account
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-text-secondary font-sans mt-1">
                Access your mindful finances and community tools with a secure,
                grounded login experience.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-primary font-sans">
                  Email or Username
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-border-sand bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-primary font-sans">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-border-sand bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans"
                  placeholder="Enter your password"
                />
              </div>

              <div className="rounded-lg border border-border-sand bg-background p-5 text-sm">
                <div className="font-serif font-semibold text-text-primary text-base">
                  Gentle Reminder
                </div>
                <p className="mt-2 leading-relaxed text-text-secondary font-sans text-xs">
                  It&apos;s okay if you&apos;ve forgotten. We keep your login
                  secure, confidential, and easy to recover.
                </p>
              </div>

              {message ? (
                <div className="rounded-lg border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta font-medium">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary hover:bg-primary-hover px-6 text-sm font-semibold text-background transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-subtle"
              >
                {loading ? "Signing in..." : "Enter Securely"}
              </button>

              {/* Developer mockup role selector */}
              <div className="pt-6 border-t border-dashed border-border-sand space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-center text-text-secondary font-bold font-sans">
                  Demo & Testing Quick Roles
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleMockLogin("STAFF")}
                    disabled={loading}
                    className="flex-1 py-2.5 text-xs font-semibold text-background bg-terracotta hover:bg-terracotta-hover rounded-full transition cursor-pointer text-center shadow-subtle border border-terracotta/20"
                  >
                    🛡️ Sign in as STAFF (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMockLogin("CUSTOMER")}
                    disabled={loading}
                    className="flex-1 py-2.5 text-xs font-semibold text-background bg-primary hover:bg-primary-hover rounded-full transition cursor-pointer text-center shadow-subtle border border-primary/20"
                  >
                    👥 Sign in as CUSTOMER
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-8 flex flex-col gap-4 border-t border-border-sand pt-6 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between font-sans">
              <p>New here?</p>
              <Link
                href="/signup"
                className="font-semibold text-primary hover:text-primary-hover underline decoration-dotted decoration-2 underline-offset-4"
              >
                Join our community
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
