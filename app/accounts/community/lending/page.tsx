"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, CheckCircle2 } from "lucide-react";

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
}

export default function CommunityLendingPage() {
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
  const router = useRouter();

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

  const trustScore = data?.trust_score ?? 98.4;
  const poolVolume = data?.active_pool_volume ?? 0;
  const requests = data?.funding_requests ?? [];
  const peersSupported = data?.peers_supported ?? 0;
  const repaidLoans = data?.repaid_loans ?? 0;
  const endorsementCount = data?.endorsements_count ?? 6;

  return (
    <div className="min-h-screen bg-background dark:bg-background-dim">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg animate-bounce">
          {successMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <section>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-white mb-2 font-serif">
                Community Lending Pool
              </h1>
              <p className="text-sm sm:text-base text-text-secondary dark:text-slate-300 max-w-2xl">
                A collective space where trust is our primary currency. Support your community through peer-backed micro-loans that fuel local dreams.
              </p>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-surface dark:bg-surface rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-slate-400 font-semibold">
                    Community Trust Score
                  </p>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <p className="text-3xl sm:text-4xl font-bold text-primary">{trustScore}</p>
                  <p className="text-text-secondary dark:text-slate-400">/ 100</p>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-300">
                  Historically resilient repayment rate across all community participants.
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

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white font-serif">
                  Active Funding Requests
                </h2>
                <button className="text-xs sm:text-sm text-primary font-semibold hover:underline">
                  View All →
                </button>
              </div>

              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request) => {
                    const progress = Math.min(100, (request.current_amount / request.target_amount) * 100);
                    return (
                      <div key={request.id} className="bg-surface dark:bg-surface rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                            {request.avatar_initials}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary dark:text-white text-sm sm:text-base font-serif">
                              {request.name}
                            </h3>
                            <p className="text-xs text-text-secondary dark:text-slate-400">{request.role}</p>
                          </div>
                          <button
                            onClick={() => setSupportModal({ isOpen: true, requestId: request.id })}
                            className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-xs sm:text-sm transition"
                          >
                            Support
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-300 mb-4">
                          {request.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-text-secondary dark:text-slate-400">
                              ₦{request.current_amount.toLocaleString()} of ₦{request.target_amount.toLocaleString()}
                            </span>
                            <span className="font-semibold text-text-primary dark:text-slate-200">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-surface dark:bg-surface rounded-xl p-8 text-center">
                  <p className="text-text-secondary dark:text-slate-400">No active funding requests at this time.</p>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#49654e] rounded-2xl p-6 text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-4 font-serif">Your Impact</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-100 font-semibold mb-1">Peers Supported</p>
                  <p className="text-2xl sm:text-3xl font-bold">{peersSupported}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-emerald-100 font-semibold mb-1">Repaid Loans</p>
                  <p className="text-2xl sm:text-3xl font-bold">{repaidLoans}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100">You've unlocked the "Pillar of Trust" badge.</p>
              <div className="flex gap-2 mt-3">
                <div className="w-8 h-8 rounded-full bg-primary" />
                <div className="w-8 h-8 rounded-full bg-surface" />
                <div className="w-8 h-8 rounded-full bg-stone-300" />
              </div>
            </div>

            <div className="bg-surface dark:bg-surface rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-text-primary dark:text-white mb-4 font-serif">Trust Network</h3>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-300 mb-6">
                {endorsementCount} neighbors have formally endorsed your creditworthiness.
              </p>
              <button
                onClick={() => router.push("/accounts/community/lending/endorsements")}
                className="w-full py-2.5 px-4 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg font-semibold text-xs sm:text-sm transition"
              >
                Request Endorsement
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-surface border border-[#49654e] rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">🛡️</div>
                <h3 className="text-lg font-bold text-primary dark:text-emerald-100 font-serif">Safeguard</h3>
              </div>
              <p className="text-xs sm:text-sm text-text-primary dark:text-slate-300">
                The pool is protected by our collective Trust-Lock mechanism. Every loan is backed by 5+ endorsements, ensuring the community supports only sustainable growth.
              </p>
            </div>
          </div>
        </div>
      </main>

      {supportModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-surface rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary dark:text-white font-serif">Support This Request</h2>
              <button
                onClick={() => setSupportModal({ isOpen: false, requestId: null })}
                className="text-stone-400 hover:text-text-secondary dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSupport} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary dark:text-white mb-2">Amount (₦)</label>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={supportAmount}
                  onChange={(e) => setSupportAmount(e.target.value)}
                  placeholder="Enter amount to support"
                  className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-surface dark:bg-stone-700 text-text-primary dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#D96C4A]"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSupportModal({ isOpen: false, requestId: null })}
                  className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg font-semibold text-text-primary dark:text-slate-200 hover:bg-background-dim dark:hover:bg-stone-700 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-stone-400 text-white rounded-lg font-semibold transition text-sm"
                >
                  {submitting ? "Supporting..." : "Support"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
