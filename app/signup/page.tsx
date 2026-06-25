"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!username || !email || !phone || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/api/signup/",
        {
          username,
          email,
          password,
          phone_number: phone,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 201) {
        setMessage("Signup successful. You may now log in.");
        setUsername("");
        setEmail("");
        setPhone("");
        setPassword("");
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        setMessage("Signup succeeded but unexpected response.");
      }
    } catch (error: any) {
      console.log("Full Backend Error:", error.response?.data);
      let errorMessage = "Unable to sign up. Please try again.";
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
                Start your journey.
              </h1>
              <p className="mt-6 text-base leading-relaxed text-text-secondary font-sans">
                Create an account with kindness and security in mind. Horizon
                Inclusion is designed to make your financial path feel calm,
                clear, and supported.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="rounded-xl border border-border-sand/80 bg-surface p-8 shadow-subtle">
                <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold font-sans">
                  Welcome environment
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-background p-5 border border-border-sand/30">
                    <p className="text-sm text-text-secondary font-sans">Privacy first</p>
                    <p className="mt-2 text-2xl font-serif font-bold text-text-primary">
                      Always
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-5 border border-border-sand/30">
                    <p className="text-sm text-text-secondary font-sans">Community-led</p>
                    <p className="mt-2 text-2xl font-serif font-bold text-text-primary">
                      Trusted
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
                    Visual Design
                  </p>
                  <p className="max-w-xs text-xs leading-relaxed text-text-secondary font-sans">
                    A refined onboarding experience to make you feel right at home with our platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Clean Minimal Signup Area */}
        <main className="flex flex-1 items-center justify-center px-6 py-10 lg:px-14 lg:py-16 bg-background">
          <div className="w-full max-w-[32rem] rounded-xl bg-surface p-8 sm:p-10 border border-border-sand shadow-subtle">
            <div className="mb-8 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary font-sans">
                Welcome Home
              </p>
              <h2 className="text-3xl font-serif font-bold text-text-primary">
                Let&apos;s begin your journey
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-text-secondary font-sans mt-1">
                Fill in the details below to set up your account and start
                managing your finances with care.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-primary font-sans">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-lg border border-border-sand bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans"
                  placeholder="Tell us how you’d like to be called"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-primary font-sans">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-border-sand bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans"
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-primary font-sans">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-lg border border-border-sand bg-background px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans"
                  placeholder="(123) 456-7890"
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
                  placeholder="Create a secure password"
                />
              </div>

              {message ? (
                <div className="rounded-lg border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta font-medium">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary hover:bg-primary-hover px-6 text-sm font-semibold text-background transition disabled:cursor-not-allowed disabled:opacity-60 shadow-subtle mt-4"
              >
                {loading ? "Creating account..." : "Continue to Security"}
              </button>
            </form>

            <div className="mt-8 flex flex-col gap-4 border-t border-border-sand pt-6 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between font-sans">
              <p>Already a member?</p>
              <Link
                href="/"
                className="font-semibold text-primary hover:text-primary-hover underline decoration-dotted decoration-2 underline-offset-4"
              >
                Log in here
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
