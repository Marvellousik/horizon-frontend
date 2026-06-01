"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-[#E8EEE8] text-slate-900 dark:bg-[#020617] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="flex flex-1 flex-col justify-center bg-[#D1E8D1] px-8 py-12 text-[#14321F] dark:bg-[#111827] dark:text-slate-100 lg:px-16 lg:py-20">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
            <div className="rounded-[2rem] bg-white/85 p-8 shadow-[0_40px_90px_rgba(18,59,26,0.15)] backdrop-blur-xl dark:bg-slate-900/90 dark:shadow-[0_40px_90px_rgba(0,0,0,0.45)]">
              <p className="text-xs uppercase tracking-[0.35em] text-[#5B7A55]">
                Horizon Inclusion
              </p>
              <h1 className="mt-6 text-6xl font-semibold leading-tight tracking-[-0.05em] text-[#10331C]">
                Growing together.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#2A4532]">
                Welcome back to Horizon Inclusion. We&apos;re here to help you
                navigate your financial journey with empathy, clarity, and
                trusted support.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-[0_20px_50px_rgba(18,59,26,0.12)]">
                <p className="text-sm uppercase tracking-[0.35em] text-[#4A6B51]">
                  Account overview
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-[#EFF5ED] p-5">
                    <p className="text-sm text-[#4F7150]">Secure access</p>
                    <p className="mt-3 text-3xl font-semibold text-[#13311F]">
                      256-bit
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-[#EFF5ED] p-5">
                    <p className="text-sm text-[#4F7150]">Trusted login</p>
                    <p className="mt-3 text-3xl font-semibold text-[#13311F]">
                      24/7
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-dashed border-white/50 bg-[#F5FBF5] p-10 shadow-[0_25px_60px_rgba(18,59,26,0.08)]">
                <div className="flex h-full flex-col items-center justify-center gap-5 rounded-[1.75rem] bg-white/70 p-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C6E2C6] text-2xl font-bold text-[#285B2C]">
                    +
                  </div>
                  <p className="text-sm uppercase tracking-[0.35em] text-[#5D7A5D]">
                    Visual placeholder
                  </p>
                  <p className="max-w-xs text-sm leading-6 text-[#566F5A]">
                    A modern banking concept area you can replace with your own
                    illustration or brand visual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center px-6 py-10 lg:px-14 lg:py-16">
          <div className="w-full max-w-[34rem] rounded-[2.5rem] bg-white p-10 shadow-[0_35px_70px_rgba(15,23,22,0.08)] dark:bg-slate-900 dark:shadow-[0_35px_70px_rgba(0,0,0,0.45)]">
            <div className="mb-10 flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#8F7B6C]">
                Welcome back
              </p>
              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-slate-900">
                Sign in to your account
              </h2>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                Access your mindful finances and community tools with a secure,
                modern login experience.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">
                  Email or Username
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-[#FAFAF6] px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-[#963D1D] focus:ring-2 focus:ring-[#E8B0A0]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-[#FAFAF6] px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-[#963D1D] focus:ring-2 focus:ring-[#E8B0A0]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Enter your password"
                />
              </div>

              <div className="rounded-[1.75rem] border border-[#D9E6D8] bg-[#EFF6EE] p-5 text-sm text-slate-700">
                <div className="font-semibold text-slate-800">
                  Gentle Reminder
                </div>
                <p className="mt-2 leading-6 text-slate-600">
                  It&apos;s okay if you&apos;ve forgotten. We keep your login
                  secure, confidential, and easy to recover.
                </p>
              </div>

              {message ? (
                <div className="rounded-[1.75rem] border border-[#E9D7CF] bg-[#FFF4EF] px-4 py-3 text-sm text-[#7B3A2C]">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-full bg-[#963D1D] px-6 text-base font-semibold text-white transition hover:bg-[#7A2F1B] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Signing in..." : "Enter Securely"}
              </button>

              {/* Dynamic developer mockup role selector */}
              <div className="pt-4 border-t border-dashed border-stone-200 dark:border-stone-850 space-y-3">
                <p className="text-xs uppercase tracking-wider text-center text-stone-500 font-semibold">
                  Demo & Testing Quick Roles
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleMockLogin("STAFF")}
                    disabled={loading}
                    className="flex-1 py-3 text-xs font-bold text-[#963D1D] bg-[#FFF4EF] hover:bg-[#FFEAE0] border border-[#E9D7CF] rounded-full transition cursor-pointer text-center"
                  >
                    🛡️ Sign in as STAFF (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMockLogin("CUSTOMER")}
                    disabled={loading}
                    className="flex-1 py-3 text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full transition cursor-pointer text-center"
                  >
                    👥 Sign in as CUSTOMER
                  </button>
                </div>
              </div>

            </form>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>New here?</p>
              <a
                href="/signup"
                className="font-semibold text-[#963D1D] transition hover:text-[#7A2F1B]"
              >
                Join our community
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

