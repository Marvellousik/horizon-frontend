"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Phone,
  Monitor,
  Users,
  CheckCircle2,
} from "lucide-react";

interface ProfileToggles {
  rent: boolean;
  phone: boolean;
  streaming: boolean;
}

interface ActivityItem {
  source: string;
  date: string;
  status: string;
  impact: string;
}

interface ProfileData {
  score: number;
  toggles: ProfileToggles;
  endorsements: number;
  activities: ActivityItem[];
}

export default function AccountsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const targetScore = 850;

  const getToken = () =>
    localStorage.getItem("access_token") ?? localStorage.getItem("accessToken");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Please login to access your Accounts dashboard.");
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log("Token before request:", token);
        const response = await axios.get(
          "http://127.0.0.1:8000/api/accounts/profile/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setData(response.data);
        setError(null);
      } catch (err: any) {
        const reportableError = err?.response ?? err;
        console.error("Accounts profile fetch error", reportableError);
        const message =
          err?.response?.data?.detail ||
          "Could not load your profile. Please refresh or login again.";
        setError(message);
        if (err?.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("accessToken");
          setUnauthorized(true);
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  useEffect(() => {
    if (!data) return;
    const target = Math.min(100, Math.max(0, (data.score / targetScore) * 100));
    const timeout = window.setTimeout(() => setAnimatedProgress(target), 100);
    return () => window.clearTimeout(timeout);
  }, [data]);

  const handleToggle = async (key: keyof ProfileToggles) => {
    if (!data) return;
    const token = getToken();
    if (!token) {
      router.push("/");
      return;
    }

    const updatedValue = !data.toggles[key];
    const boostAmounts: Record<keyof ProfileToggles, number> = {
      rent: 50,
      phone: 40,
      streaming: 20,
    };
    const boost = updatedValue ? boostAmounts[key] : -boostAmounts[key];

    setData({
      ...data,
      score: Math.max(0, data.score + boost),
      toggles: {
        ...data.toggles,
        [key]: updatedValue,
      },
    });
    setUpdating(true);
    setError(null);

    try {
      const payload = { [`${key}_verified`]: updatedValue };
      const response = await axios.patch(
        "http://127.0.0.1:8000/api/accounts/profile/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data?.score) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                score: response.data.score,
                toggles: {
                  ...prev.toggles,
                  [key]: updatedValue,
                },
              }
            : prev,
        );
      } else if (
        response.data?.detail &&
        response.data?.detail.toLowerCase().includes("unauthorized")
      ) {
        setError("Unauthorized access. Please login again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("accessToken");
        router.push("/");
      } else {
        const refreshResponse = await axios.get(
          "http://127.0.0.1:8000/api/accounts/profile/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setData(refreshResponse.data);
      }
    } catch (err: any) {
      console.error("Toggle update failed", err.response ?? err);
      setError("Unable to update the status. Please try again.");
      setData((prev) =>
        prev
          ? {
              ...prev,
              score: Math.max(0, prev.score - boost),
              toggles: {
                ...prev.toggles,
                [key]: !updatedValue,
              },
            }
          : prev,
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    const base =
      lower === "verified"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
        : lower === "pending"
          ? "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
          : lower === "new"
            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
            : "bg-stone-100 text-stone-800 dark:bg-surface dark:text-stone-200";
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${base}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background  p-4">
        <div className="text-center">
          <p className="text-3xl animate-bounce mb-4">📊</p>
          <p className="text-sm sm:text-base text-text-primary dark:text-slate-200">
            Loading your accounts...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background  p-4">
        <div className="max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8 text-red-700 shadow-sm dark:border-red-800 dark:bg-surface dark:text-red-200">
          <h2 className="mb-3 text-lg sm:text-2xl font-semibold font-serif">
            Account error
          </h2>
          <p className="mb-4 text-xs sm:text-sm leading-6">{error}</p>
          {unauthorized ? (
            <button
              onClick={() => router.push("/")}
              className="rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              Go to Login
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background px-3 sm:px-6 py-6 sm:py-8 dark:bg-background-dim">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <div className="grid gap-6 sm:gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-xl bg-surface p-4 sm:p-8 shadow-sm dark:bg-surface dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 sm:gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-text-secondary font-sans dark:text-slate-400">
                  Alternative Credit Scan
                </p>
                <h1 className="mt-2 sm:mt-4 text-2xl sm:text-4xl font-semibold tracking-[-0.03em] text-text-primary dark:text-slate-100 font-serif">
                  Horizon Score
                </h1>
                <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm leading-6 sm:leading-7 text-text-secondary dark:text-slate-300">
                  Beyond traditional banking. We calculate your Horizon Score
                  based on your actual lifestyle commitments and community
                  trust.
                </p>
              </div>
              <div className="rounded-xl border border-border-sand bg-background-dim p-4 sm:p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950 flex-shrink-0">
                <div className="relative mx-auto flex h-40 sm:h-48 w-40 sm:w-48 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="absolute h-full w-full">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="fill-transparent stroke-slate-200"
                      strokeWidth="14"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="fill-transparent stroke-primary"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={Math.PI * 2 * 52}
                      strokeDashoffset={
                        Math.PI * 2 * 52 * (1 - animatedProgress / 100)
                      }
                      transform="rotate(-90 60 60)"
                      style={{ transition: "stroke-dashoffset 900ms ease-out" }}
                    />
                  </svg>
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <p className="text-3xl sm:text-5xl font-bold text-primary">
                      {data.score}
                    </p>
                    <span className="mt-1 sm:mt-2 text-xs uppercase tracking-[0.35em] text-text-secondary dark:text-slate-400">
                      Score
                    </span>
                  </div>
                </div>
                <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-text-secondary dark:text-slate-400">
                  +24 this month
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 sm:space-y-6">
            <Link
              href="/accounts/community/lending"
              className="block rounded-xl bg-surface p-4 sm:p-6 shadow-sm transition hover:border-primary/20 dark:bg-background-dim dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-text-secondary font-sans dark:text-slate-400">
                    Trust Network
                  </p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-text-primary dark:text-white">
                    {data.endorsements}
                  </p>
                </div>
                <div className="flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <Users className="h-5 sm:h-6 w-5 sm:w-6" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-6 text-text-secondary dark:text-slate-300">
                Community endorsements that help improve your Horizon Score and
                loan eligibility.
              </p>
            </Link>

            <div className="rounded-xl bg-primary p-4 sm:p-6 text-white shadow-sm dark:bg-[#b55b38]">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="mt-0.5 sm:mt-1 rounded-xl bg-surface/15 p-2 sm:p-3 text-white flex-shrink-0">
                  <CreditCard className="h-5 sm:h-6 w-5 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-semibold font-serif">
                    Unlock Micro-Loan eligibility
                  </h2>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-6 text-white/85">
                    Maintain your Streaming toggle for 2 more months to unlock
                    up to ₦500 in interest-free bridging capital.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRoadmapOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface px-5 py-3 text-sm font-semibold text-primary transition hover:bg-surface/90"
              >
                View Roadmap <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl bg-surface p-8 shadow-sm dark:bg-surface dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-text-secondary font-sans dark:text-slate-400">
                  Connected data sources
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-text-primary dark:text-slate-100 font-serif">
                  Verification toggles
                </h2>
              </div>
              <p className="text-sm text-text-secondary dark:text-slate-400">
                {updating ? "Updating..." : "Tap any toggle to update status."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleToggle("rent")}
                className="group rounded-xl border border-border-sand bg-background-dim p-5 text-left transition hover:border-primary dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-slate-100">
                      Rent Payments
                    </p>
                    <p className="mt-2 text-xs text-text-secondary dark:text-slate-400">
                      Verified by PropertyLink
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.35em] text-text-secondary dark:text-slate-400">
                    Status
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      data.toggles.rent
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {data.toggles.rent ? "On" : "Off"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggle("phone")}
                className="group rounded-xl border border-border-sand bg-background-dim p-5 text-left transition hover:border-primary dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-slate-100">
                      Phone Bill
                    </p>
                    <p className="mt-2 text-xs text-text-secondary dark:text-slate-400">
                      Consistent 24-month history
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.35em] text-text-secondary dark:text-slate-400">
                    Status
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      data.toggles.phone
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {data.toggles.phone ? "On" : "Off"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggle("streaming")}
                className="group rounded-xl border border-border-sand bg-background-dim p-5 text-left transition hover:border-primary dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-slate-100">
                      Streaming
                    </p>
                    <p className="mt-2 text-xs text-text-secondary dark:text-slate-400">
                      Netflix, Spotify, & more
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.35em] text-text-secondary dark:text-slate-400">
                    Status
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      data.toggles.streaming
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {data.toggles.streaming ? "On" : "Off"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-surface p-8 shadow-sm dark:bg-background-dim dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-text-secondary font-sans dark:text-slate-400">
                  Recent Activity
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-text-primary dark:text-white font-serif">
                  Activity timeline
                </h2>
              </div>
              <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-text-secondary dark:bg-surface dark:text-stone-300">
                Encrypted & Private
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border-sand dark:border-border-sand/40">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-background-dim text-text-secondary dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activities.map((activity, index) => (
                    <tr
                      key={`${activity.source}-${index}`}
                      className={
                        index % 2 === 0
                          ? "bg-surface dark:bg-[#111827]"
                          : "bg-background-dim dark:bg-[#0b1220]"
                      }
                    >
                      <td className="px-6 py-5 text-slate-800 dark:text-white">
                        {activity.source}
                      </td>
                      <td className="px-6 py-5 text-text-secondary dark:text-slate-300">
                        {activity.date}
                      </td>
                      <td className="px-6 py-5">
                        {renderStatusBadge(activity.status)}
                      </td>
                      <td className="px-6 py-5 text-slate-800 dark:text-white">
                        {activity.impact}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isRoadmapOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6">
          <div className="w-full max-w-2xl rounded-xl bg-surface p-8 shadow-2xl dark:bg-background-dim dark:text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-text-secondary font-sans dark:text-slate-400">
                  Path to 850
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-text-primary dark:text-white font-serif">
                  Rewards milestone roadmap
                </h2>
              </div>
              <button
                onClick={() => setIsRoadmapOpen(false)}
                className="rounded-full border border-border-sand px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-background-dim dark:border-border-sand/40 dark:text-white dark:hover:bg-stone-800"
              >
                Close
              </button>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl border border-border-sand bg-background-dim p-5 dark:border-border-sand/40 dark:bg-stone-950">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="font-semibold text-text-primary dark:text-white">
                    Verify Rent
                  </p>
                  <p className="text-sm text-text-secondary dark:text-slate-300">
                    +50 points when your rent payment is confirmed.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border-sand bg-background-dim p-5 dark:border-border-sand/40 dark:bg-stone-950">
                <CheckCircle2 className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold text-text-primary dark:text-white">
                    3 Months Consistent Savings
                  </p>
                  <p className="text-sm text-text-secondary dark:text-slate-300">
                    +40 points for keeping a steady savings streak.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border-sand bg-background-dim p-5 dark:border-border-sand/40 dark:bg-stone-950">
                <CheckCircle2 className="h-6 w-6 text-sky-500" />
                <div>
                  <p className="font-semibold text-text-primary dark:text-white">
                    Community Endorsements
                  </p>
                  <p className="text-sm text-text-secondary dark:text-slate-300">
                    +20 points when trusted members vouch for you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
