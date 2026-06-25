"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Heart, Plus, Bell, User, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface FundingRequest {
  id: string | number;
  name: string;
  role: string;
  description: string;
  current_amount: number;
  target_amount: number;
  avatar_initials: string;
}

interface DashboardData {
  trust_score: number;
  active_pool_volume: number;
  peers_supported: number;
  repaid_loans: number;
  endorsements_count: number;
  funding_requests: FundingRequest[];
  endorsers: Array<{
    name: string;
    vouched_date: string;
  }>;
}

export default function LendingPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supportModal, setSupportModal] = useState<{ isOpen: boolean; requestId: string | number | null }>({
    isOpen: false,
    requestId: null,
  });
  const [supportAmount, setSupportAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getToken = () =>
    localStorage.getItem("access_token") ?? localStorage.getItem("accessToken");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Please login to access the lending pool.");
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await axios.get<DashboardData>(
          "http://127.0.0.1:8000/api/lending/dashboard/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setData(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch lending dashboard:", err);
        setError("Unable to load the lending pool. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !supportModal.requestId) return;

    const amount = parseFloat(supportAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/lending/requests/${supportModal.requestId}/support/`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setSuccessMessage("Thank you for supporting this request! 🎉");
      setSupportModal({ isOpen: false, requestId: null });
      setSupportAmount("");

      // Re-fetch dashboard to update amounts
      const response = await axios.get<DashboardData>(
        "http://127.0.0.1:8000/api/lending/dashboard/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setData(response.data);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to support request:", err);
      setError("Failed to process your support. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-bounce mb-4 inline-block">🌿</span>
          <p className="text-text-primary dark:text-slate-200 mt-4">
            Loading community pool...
          </p>
        </div>
      </div>
    );
  }

  const trustScore = data?.trust_score ?? 98.4;
  const poolVolume = data?.active_pool_volume ?? 12450;
  const requests = data?.funding_requests ?? [];
  const peersSupported = data?.peers_supported ?? 0;
  const repaidLoans = data?.repaid_loans ?? 0;
  const endorsementCount = data?.endorsements_count ?? 6;
  const endorsers = data?.endorsers ?? [];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dim">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-40 bg-surface dark:bg-surface border-b border-border-sand dark:border-border-sand/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                H
              </div>
              <span className="font-serif italic font-bold text-lg sm:text-xl text-primary hidden sm:inline">
                Horizon
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-text-secondary dark:text-slate-300 hover:text-primary transition">
              Home
            </Link>
            <Link href="/lending" className="text-primary font-semibold">
              Lending
            </Link>
            <Link href="/impact" className="text-text-secondary dark:text-slate-300 hover:text-primary transition">
              Impact
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition">
              <Bell className="w-5 h-5 text-text-secondary dark:text-slate-300" />
            </button>
            <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition">
              <User className="w-5 h-5 text-text-secondary dark:text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg animate-bounce">
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            {/* Header */}
            <section>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white mb-2 font-serif">
                Community Lending Pool
              </h1>
              <p className="text-sm sm:text-base text-text-secondary dark:text-slate-300 max-w-2xl">
                A collective space where trust is our primary currency. Support your community members through peer-backed micro-loans that fuel local dreams.
              </p>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-surface dark:bg-surface rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-slate-400 font-semibold">
                    Community Trust Score
                  </p>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <p className="text-3xl sm:text-4xl font-bold text-primary">
                    {trustScore}
                  </p>
                  <p className="text-text-secondary dark:text-slate-400">/ 100</p>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-300">
                  Historically resilient repayment rate across all pool participants.
                </p>
              </div>

              <div className="bg-surface dark:bg-surface rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-slate-400 font-semibold">
                    Active Pool Volume
                  </p>
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white mb-4">
                  ₦{poolVolume.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-300">
                  Current liquidity available for community micro-financing requests.
                </p>
              </div>
            </section>

            {/* Active Requests */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white font-serif">
                  Active Funding Requests
                </h2>
                <Link href="#" className="text-xs sm:text-sm text-primary font-semibold hover:underline">
                  View All →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {requests.map((request) => {
                  const percentage = Math.min(
                    100,
                    (request.current_amount / request.target_amount) * 100,
                  );
                  return (
                    <div
                      key={request.id}
                      className="bg-surface dark:bg-surface rounded-2xl p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                          {request.avatar_initials}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary dark:text-white">
                            {request.name}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-slate-400">
                            {request.role}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-text-secondary dark:text-slate-300 italic mb-4">
                        "{request.description}"
                      </p>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-text-secondary dark:text-slate-400">
                            Community Backing
                          </span>
                          <span className="font-bold text-primary">
                            ₦{request.current_amount.toLocaleString()} / ₦{request.target_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSupportModal({ isOpen: true, requestId: request.id });
                          setSupportAmount("");
                        }}
                        className="w-full py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover transition"
                      >
                        Support {request.name.split(" ")[0]}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Your Impact */}
            <div className="bg-[#49654e] text-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-6 font-serif">Your Impact</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs opacity-80 mb-1">Peers Supported</p>
                  <p className="text-2xl sm:text-3xl font-bold">{peersSupported}</p>
                </div>
                <div>
                  <p className="text-xs opacity-80 mb-1">Repaid Loans</p>
                  <p className="text-2xl sm:text-3xl font-bold">{repaidLoans}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-xs opacity-90 mb-3">
                  You've unlocked the 'Pillar of Trust' badge.
                </p>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[#49654e] bg-primary" />
                  <div className="w-8 h-8 rounded-full border-2 border-[#49654e] bg-[#C8E8CB]" />
                  <div className="w-8 h-8 rounded-full border-2 border-[#49654e] bg-[#FCF9F2]" />
                </div>
              </div>
            </div>

            {/* Trust Network */}
            <div className="bg-surface dark:bg-surface rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-text-primary dark:text-white mb-4 font-serif">
                Trust Network
              </h3>
              <p className="text-sm text-text-secondary dark:text-slate-300 mb-4">
                {endorsementCount} neighbors have formally endorsed your creditworthiness.
              </p>

              <div className="space-y-3 mb-6">
                {endorsers.slice(0, 2).map((endorser, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-sm font-bold text-text-secondary dark:text-slate-300">
                      {endorser.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary dark:text-white text-sm">
                        {endorser.name}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-slate-400">
                        Vouched {endorser.vouched_date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-3 border border-stone-300 dark:border-stone-600 rounded-full font-semibold text-text-primary dark:text-slate-200 hover:bg-background-dim dark:hover:bg-stone-700 transition">
                Request Endorsement
              </button>
            </div>

            {/* Safeguard */}
            <div className="bg-emerald-100/50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 relative overflow-hidden">
              <h3 className="text-lg font-bold text-primary mb-3 font-serif">🛡️ Safeguard</h3>
              <p className="text-sm text-primary leading-relaxed">
                The pool is protected by our collective Trust-Lock mechanism. Every loan is backed by 5+ endorsements, ensuring that the community supports only sustainable and intentional growth.
              </p>
              <button className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Support Modal */}
      {supportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="bg-surface dark:bg-surface rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4 font-serif">
              Support This Request
            </h2>
            <form onSubmit={handleSupport} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary dark:text-slate-200 mb-2">
                  Amount to Support (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={supportAmount}
                  onChange={(e) => setSupportAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-600 bg-surface dark:bg-background-dim text-text-primary dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSupportModal({ isOpen: false, requestId: null })}
                  className="flex-1 px-4 py-3 rounded-full border border-stone-300 dark:border-stone-600 text-text-primary dark:text-slate-200 font-semibold hover:bg-background-dim dark:hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Support Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}