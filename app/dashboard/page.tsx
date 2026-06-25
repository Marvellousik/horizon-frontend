"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Send,
  ShoppingCart,
  Coffee,
  Home,
  Zap,
  Wifi,
  MessageSquare,
  ArrowRight,
  Lightbulb,
  Maximize,
  X,
  Sparkles,
  Camera,
  CheckCircle2,
} from "lucide-react";

interface DashboardData {
  username: string;
  savings_balance: number;
  current_balance: number;
  recent_transactions: Array<{
    id: string;
    merchant: string;
    category: string;
    amount: number;
    timestamp: string;
    processed_by_staff_id?: string;
    branch_code?: string;
  }>;
}

interface SettingsPreferences {
  dyslexia_font: boolean;
  simplified_numbers: boolean;
  anxiety_mode: boolean;
  high_contrast_mode: boolean;
}

const getCategoryIcon = (category?: string) => {
  const normalizedCategory = category?.toLowerCase().trim() ?? "";

  switch (normalizedCategory) {
    case "groceries":
      return <ShoppingCart className="h-5 w-5 text-primary dark:text-emerald-400" />;
    case "dining":
      return <Coffee className="h-5 w-5 text-primary dark:text-orange-400" />;
    case "housing":
    case "rent":
      return <Home className="h-5 w-5 text-[#4a6153] dark:text-teal-400" />;
    default:
      return <ShoppingCart className="h-5 w-5 text-text-secondary dark:text-slate-400" />;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accessibility Preferences
  const [preferences, setPreferences] = useState<SettingsPreferences>({
    dyslexia_font: false,
    simplified_numbers: false,
    anxiety_mode: false,
    high_contrast_mode: false,
  });

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  // Scan simulation states
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success">("idle");
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Payment states
  const [account_no, setAccount_no] = useState("");
  const [destination_account, setDestination_account] = useState("");
  const [amount, setAmount] = useState("");
  const [billName, setBillName] = useState("");
  const [bankingLoading, setBankingLoading] = useState(false);
  const [bankingError, setBankingError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedName = localStorage.getItem("username");
    if (storedName) {
      setDisplayName(storedName);
    }

    if (!token) {
      router.push("/");
      return;
    }

    const fetchDashboardAndPrefs = async () => {
      try {
        // Fetch dashboard data
        const dashboardResponse = await axios.get(
          "http://127.0.0.1:8000/api/dashboard/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        setData(dashboardResponse.data);
        setDisplayName(dashboardResponse.data.username || storedName || "");
        setError(null);

        // Fetch settings preferences
        try {
          const prefsResponse = await axios.get<SettingsPreferences>(
            "http://127.0.0.1:8000/api/settings/preferences/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          setPreferences(prefsResponse.data);
        } catch (prefErr) {
          console.error("Preferences fetch error:", prefErr);
        }
      } catch (err: any) {
        console.error("Dashboard Load Error:", err);
        setError(err.response?.data?.detail || "Failed to load dashboard data");
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("username");
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAndPrefs();
  }, [router]);

  const formatCurrency = (amountVal: number) => {
    const displayValue = preferences.simplified_numbers ? Math.round(amountVal) : amountVal;
    return `₦${displayValue.toLocaleString("en-NG", {
      minimumFractionDigits: preferences.simplified_numbers ? 0 : 2,
      maximumFractionDigits: preferences.simplified_numbers ? 0 : 2,
    })}`;
  };

  const getTransactionSentence = (tx: any) => {
    const amt = formatCurrency(tx.amount);
    const merchant = tx.merchant || tx.recipient || tx.destination_account || "";
    const cat = (tx.category || "").toLowerCase().trim();

    if (cat === "transfer" || cat === "payment") {
      return `Transfer of ${amt} to ${merchant || "external account"} completed.`;
    }
    if (cat === "deposit") {
      return `Deposit of ${amt} processed successfully.`;
    }
    if (cat === "withdrawal") {
      return `Withdrawal of ${amt} from main account.`;
    }
    if (cat === "dining") {
      return `Spent ${amt} on dining at ${merchant || "Dining Partner"}.`;
    }
    if (cat === "groceries") {
      return `Purchased groceries for ${amt} at ${merchant || "Store"}.`;
    }
    if (cat === "housing" || cat === "rent") {
      return `Paid ${amt} for housing expenses to ${merchant || "Landlord"}.`;
    }

    return `Transaction of ${amt} at ${merchant || "Merchant"} recorded.`;
  };

  const extractOraError = (err: any): string => {
    console.error("Banking operation failed:", err);
    const dataVal = err?.response?.data;
    if (!dataVal) return "Failed to process transaction. Please try again.";

    const findOraPattern = (str: string) => {
      const match = str.match(/ORA-\d+:[^"\n]*/);
      return match ? match[0] : null;
    };

    if (typeof dataVal === "string") {
      const ora = findOraPattern(dataVal);
      if (ora) return ora;
      return dataVal;
    }

    const candidates = [dataVal.error, dataVal.detail, dataVal.message, dataVal.exception];
    for (const val of candidates) {
      if (typeof val === "string") {
        const ora = findOraPattern(val);
        if (ora) return ora;
      }
    }

    if (typeof dataVal === "object") {
      for (const key of Object.keys(dataVal)) {
        const val = dataVal[key];
        if (typeof val === "string") {
          const ora = findOraPattern(val);
          if (ora) return ora;
        } else if (Array.isArray(val) && typeof val[0] === "string") {
          const ora = findOraPattern(val[0]);
          if (ora) return ora;
        }
      }

      for (const val of candidates) {
        if (typeof val === "string") return val;
      }

      for (const key of Object.keys(dataVal)) {
        if (typeof dataVal[key] === "string") return dataVal[key];
      }
    }

    return "Failed to process transaction. Please try again.";
  };

  const handleBillPayment = async (type: "transfer" | "withdraw") => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setBankingError("Please login to perform this action.");
      return;
    }

    if (!account_no.trim()) {
      setBankingError("Please enter your account number.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setBankingError("Please enter a valid amount.");
      return;
    }

    setBankingLoading(true);
    setBankingError(null);
    setPaymentSuccess(null);

    try {
      if (type === "transfer") {
        if (!destination_account.trim()) {
          setBankingError("Please enter the destination provider account.");
          setBankingLoading(false);
          return;
        }

        await axios.post(
          "/api/bank/proc-transfer/",
          {
            source_account: account_no.trim(),
            destination_account: destination_account.trim(),
            amount: parsedAmount,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } else {
        await axios.post(
          "/api/bank/proc-withdraw/",
          {
            account_no: account_no.trim(),
            amount: parsedAmount,
            staff_id: null,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      }

      setPaymentSuccess(`Successfully paid ${formatCurrency(parsedAmount)} for ${billName}!`);

      // Refresh dashboard data
      const response = await axios.get(
        "http://127.0.0.1:8000/api/dashboard/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      setData(response.data);

      setTimeout(() => {
        setShowPaymentModal(false);
        setAccount_no("");
        setDestination_account("");
        setAmount("");
        setBillName("");
        setPaymentSuccess(null);
      }, 1500);
    } catch (err: any) {
      setBankingError(extractOraError(err));
    } finally {
      setBankingLoading(false);
    }
  };

  // Scan simulation action
  const handleStartScan = () => {
    setScanStatus("scanning");
    setScanResult(null);

    setTimeout(() => {
      setScanStatus("success");
      setScanResult("Provider: FiberLink (A/C: 100500600) | Amount: ₦60.00");
    }, 2000);
  };

  const handleApplyScanResult = () => {
    setBillName("Scanned Internet Bill");
    setDestination_account("100500600");
    setAmount("60.00");
    setBankingError(null);
    setPaymentSuccess(null);
    
    setShowScanModal(false);
    setScanStatus("idle");
    setScanResult(null);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background  p-6">
        <div className="text-text-secondary dark:text-slate-200">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background  p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-surface p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background  p-6">
        <div className="text-text-secondary dark:text-slate-200">No data available</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 md:px-12 py-6 md:py-10 max-w-7xl mx-auto bg-background ">
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 1; }
        }
      `}</style>

      {/* Welcome Header & Quick Actions */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-text-primary dark:text-slate-100 mb-2">
            Hello, {displayName || data.username}
          </h2>
          <p className="text-base md:text-lg text-text-secondary dark:text-slate-350 max-w-md">
            Take a deep breath. Your finances are looking steady today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:overflow-visible">
          <button
            onClick={() => router.push("/savings")}
            className="flex items-center gap-3 bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold shadow-lg shadow-[#D96C4A]/20 hover:opacity-90 transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Send className="h-5 w-5" />
            <span className="inline">Transfer</span>
          </button>
          <button
            onClick={() => {
              setBillName("Quick Payment");
              setDestination_account("");
              setAmount("");
              setBankingError(null);
              setPaymentSuccess(null);
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-3 bg-secondary/20 text-text-primary font-serif px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold hover:bg-[#b3deb8] transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="inline">Pay</span>
          </button>
          <button
            onClick={() => {
              setScanStatus("idle");
              setScanResult(null);
              setShowScanModal(true);
            }}
            className="flex items-center gap-3 bg-stone-100 text-text-primary dark:bg-slate-800 dark:text-slate-100 px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold hover:bg-stone-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Maximize className="h-5 w-5" />
            <span className="inline">Scan</span>
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Column - Main Content (70%) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Safe to Spend Card */}
          <section className="bg-surface p-8 md:p-12 rounded-xl shadow-sm relative overflow-hidden dark:bg-surface dark:shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-border-sand/40 dark:border-border-sand/40">
            {/* Decorative Background */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-secondary/20/30 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary/20 text-text-primary font-serif text-sm font-medium mb-6">
                ✓ Safe to spend
              </div>

              <div className="mb-6">
                <h3 className="text-6xl md:text-7xl font-bold text-primary tracking-tight font-serif">
                  {formatCurrency(data.savings_balance)}
                </h3>
                <p className="mt-3 text-base text-text-secondary dark:text-slate-300">
                  After all your bills are covered for the month.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 space-y-3">
                <div className="h-3 w-full bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full animate-pulse"
                    style={{
                      width: `${Math.min(
                        (data.savings_balance / data.current_balance) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm text-text-secondary dark:text-slate-400 font-medium">
                  <span>
                    Spent: {formatCurrency(data.savings_balance)}
                  </span>
                  <span>
                    Budget: {formatCurrency(data.current_balance)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Insights */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-2xl font-serif font-bold text-text-primary dark:text-slate-100">
                Recent Insights
              </h4>
              <a
                href="#"
                className="text-primary font-semibold flex items-center gap-1 hover:underline text-sm sm:text-base"
              >
                View History <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="space-y-4">
              {data.recent_transactions &&
              data.recent_transactions.length > 0 ? (
                data.recent_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-surface dark:bg-surface border border-border-sand/40 dark:border-border-sand/40/80 p-5 rounded-xl flex items-center gap-4 sm:gap-6 group hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(tx.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                        <h5 className="font-semibold text-text-primary dark:text-slate-100 text-sm sm:text-base leading-snug break-words pr-2">
                          {getTransactionSentence(tx)}
                        </h5>
                        <span className="font-bold text-text-primary dark:text-slate-100 text-sm sm:text-base shrink-0">
                          -{formatCurrency(tx.amount)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-400 dark:text-slate-400 mt-1 uppercase tracking-wider">
                        {tx.category || "General"} • {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : "Recently"}
                      </p>
                      {(tx.processed_by_staff_id || tx.branch_code) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tx.processed_by_staff_id && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF0EC] text-primary dark:bg-[#381c15] dark:text-[#f8a892] border border-[#f3d3c9] dark:border-[#5a281e] tracking-wide">
                              Staff: {tx.processed_by_staff_id}
                            </span>
                          )}
                          {tx.branch_code && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-background-dim text-primary dark:bg-[#14261a] dark:text-[#a8e8b9] border border-[#d2e8d4] dark:border-[#1e482f] tracking-wide">
                              Branch: {tx.branch_code}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-secondary dark:text-slate-450 italic">No recent transactions recorded</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar (30%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Gentle Reminders */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-lg font-serif font-bold text-text-primary dark:text-slate-100">
                Gentle Reminders
              </h4>
              <span className="h-2 w-2 rounded-full bg-primary"></span>
            </div>

            <div className="space-y-4">
              {/* Reminder 1 */}
              <div className="bg-surface dark:bg-surface border border-border-sand/40 dark:border-border-sand/40/80 rounded-xl p-6 border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-xs text-stone-400 dark:text-slate-400">Due in 3 days</span>
                </div>
                <h5 className="font-semibold text-text-primary dark:text-slate-100 mb-1">
                  Electricity Bill
                </h5>
                <p className="text-base text-text-primary dark:text-slate-200 mb-4 font-semibold">
                  {formatCurrency(84.50)}
                </p>
                <button
                  onClick={() => {
                    setBillName("Electricity Bill");
                    setDestination_account("100200300");
                    setAmount("84.50");
                    setBankingError(null);
                    setPaymentSuccess(null);
                    setShowPaymentModal(true);
                  }}
                  className="w-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#FDE0D2] py-2 rounded-full font-semibold hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                >
                  Pay Now
                </button>
              </div>

              {/* Reminder 2 */}
              <div className="bg-surface dark:bg-surface border border-border-sand/40 dark:border-border-sand/40/80 rounded-xl p-6 border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <Wifi className="h-5 w-5 text-primary" />
                  <span className="text-xs text-stone-400 dark:text-slate-400">Due in 5 days</span>
                </div>
                <h5 className="font-semibold text-text-primary dark:text-slate-100 mb-1">
                  Home Internet
                </h5>
                <p className="text-base text-text-primary dark:text-slate-200 mb-4 font-semibold">
                  {formatCurrency(60.00)}
                </p>
                <button
                  onClick={() => {
                    setBillName("Home Internet");
                    setDestination_account("100500600");
                    setAmount("60.00");
                    setBankingError(null);
                    setPaymentSuccess(null);
                    setShowPaymentModal(true);
                  }}
                  className="w-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#FDE0D2] py-2 rounded-full font-semibold hover:bg-primary/20 transition-colors text-sm cursor-pointer"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </section>

          {/* Did you know? */}
          <div className="bg-[#cfe9d7] p-6 rounded-lg relative overflow-hidden dark:bg-[#123124]">
            <div className="relative z-10">
              <h5 className="font-serif font-bold text-text-primary font-serif dark:text-emerald-100 mb-2 text-lg">
                Did you know?
              </h5>
              <p className="text-base text-[#1a3a20] dark:text-emerald-250 leading-relaxed mb-4">
                Setting aside just ₦5 a day could help you reach your "Rainy
                Day" goal by December.
              </p>
              <button className="text-text-primary font-serif dark:text-emerald-100 font-semibold border-b border-[#10331C] dark:border-emerald-100 hover:opacity-70 text-sm cursor-pointer">
                Start Auto-Save
              </button>
            </div>
            <Lightbulb className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 text-text-primary font-serif dark:text-emerald-100" />
          </div>

          {/* Support Card */}
          <div className="bg-surface p-8 rounded-lg text-center flex flex-col items-center gap-4 shadow-sm dark:bg-surface dark:border dark:border-border-sand/40">
            <div className="w-16 h-16 rounded-full bg-secondary/20 dark:bg-emerald-950/40 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-text-primary font-serif dark:text-emerald-400" />
            </div>
            <div>
              <h5 className="font-semibold text-text-primary dark:text-slate-100">Need help?</h5>
              <p className="text-sm text-text-secondary dark:text-slate-400">
                Our empathetic team is here for you.
              </p>
            </div>
            <button
              onClick={() => router.push("/oracle")}
              className="text-primary dark:text-[#f39575] font-semibold hover:opacity-70 text-sm cursor-pointer"
            >
              Chat with an advisor
            </button>
          </div>
        </div>
      </div>

      {/* Accessibilities & Preferences Aware Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/60 p-4 md:p-6 backdrop-blur-sm transition-all duration-300">
          <div className={`bg-surface dark:bg-surface p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto 
            ${preferences.dyslexia_font ? "font-mono tracking-wide leading-relaxed" : ""} 
            ${preferences.high_contrast_mode ? "border-4 border-black dark:border-white rounded-none" : "border border-stone-100 dark:border-border-sand/40 rounded-t-[2rem] md:rounded-xl"}
          `}>
            
            {/* Calming reassurance banner for Anxiety Mode */}
            {preferences.anxiety_mode && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-text-primary font-serif dark:text-emerald-300 text-xs sm:text-sm mb-6 flex items-start gap-3">
                <span className="text-lg">🌱</span>
                <div>
                  <p className="font-semibold">Mindful Security Check</p>
                  <p className="mt-1 opacity-90">Take a deep breath. Payments are processed securely with no extra transaction fees. There is absolutely no rush.</p>
                </div>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white mb-2 font-serif">
              Pay Bill: {billName}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-400 mb-6">
              {preferences.anxiety_mode 
                ? "Select a payment preference to securely finish."
                : "Execute a direct database transaction to complete your bill settlement instantly."
              }
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-slate-200 mb-2">
                  Source Account Number
                </label>
                <input
                  type="text"
                  value={account_no}
                  onChange={(e) => setAccount_no(e.target.value)}
                  placeholder="Enter your account number"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-surface dark:bg-slate-955 text-sm sm:text-base text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/20
                    ${preferences.high_contrast_mode ? "border-2 border-black dark:border-white focus:border-red-600 rounded-none font-bold" : "border border-border-sand dark:border-stone-600 rounded-xl focus:border-primary"}
                  `}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-slate-200 mb-2">
                  Destination Provider Account
                </label>
                <input
                  type="text"
                  value={destination_account}
                  onChange={(e) => setDestination_account(e.target.value)}
                  placeholder="Enter destination account"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-surface dark:bg-slate-955 text-sm sm:text-base text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/20
                    ${preferences.high_contrast_mode ? "border-2 border-black dark:border-white focus:border-red-600 rounded-none font-bold" : "border border-border-sand dark:border-stone-600 rounded-xl focus:border-primary"}
                  `}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span>Amount (₦)</span>
                  {preferences.simplified_numbers && (
                    <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-950/20 dark:text-amber-350">
                      Rounded for Simplicity
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-surface dark:bg-slate-955 text-sm sm:text-base text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/20
                    ${preferences.high_contrast_mode ? "border-2 border-black dark:border-white focus:border-red-600 rounded-none font-bold" : "border border-border-sand dark:border-stone-600 rounded-xl focus:border-primary"}
                  `}
                />
              </div>

              {bankingError && (
                <div className="p-3 sm:p-4 rounded-xl bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                  {bankingError}
                </div>
              )}

              {paymentSuccess && (
                <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
                  {paymentSuccess}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={bankingLoading}
                    onClick={() => handleBillPayment("transfer")}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white font-semibold transition disabled:opacity-50 cursor-pointer
                      ${preferences.high_contrast_mode ? "bg-black hover:bg-stone-850 dark:bg-surface dark:text-black border border-black dark:border-white rounded-none" : "bg-primary hover:bg-primary-hover rounded-full"}
                    `}
                  >
                    {bankingLoading ? "Processing..." : "Pay via Transfer"}
                  </button>
                  <button
                    type="button"
                    disabled={bankingLoading}
                    onClick={() => handleBillPayment("withdraw")}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white font-semibold transition disabled:opacity-50 cursor-pointer
                      ${preferences.high_contrast_mode ? "bg-black hover:bg-stone-850 dark:bg-surface dark:text-black border border-black dark:border-white rounded-none" : "bg-[#49654e] hover:bg-[#3b523f] rounded-full"}
                    `}
                  >
                    {bankingLoading ? "Processing..." : "Pay via Withdrawal"}
                  </button>
                </div>
                <button
                  type="button"
                  disabled={bankingLoading}
                  onClick={() => setShowPaymentModal(false)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition cursor-pointer
                    ${preferences.high_contrast_mode ? "border border-black dark:border-white bg-transparent text-black dark:text-white rounded-none" : "border border-border-sand dark:border-stone-600 text-text-primary dark:text-slate-250 hover:bg-background-dim dark:hover:bg-stone-800 rounded-full"}
                  `}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holographic scanner camera mockup scan modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
          <div className="bg-surface dark:bg-surface rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-100 dark:border-border-sand/40 relative overflow-hidden">
            
            {/* Decorative holographic nodes */}
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-secondary/20/15 dark:bg-secondary/20/5 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white font-serif flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Holographic Scan
              </h2>
              <button 
                onClick={() => {
                  setShowScanModal(false);
                  setScanStatus("idle");
                  setScanResult(null);
                }}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-text-secondary dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-400 mb-6">
              Fit a banking QR code or invoice barcode within the scanning bounds to execute auto-detection.
            </p>

            <div className="space-y-6">
              {/* Animated scan viewport area */}
              <div className="aspect-square bg-slate-950 dark:bg-black rounded-2xl relative overflow-hidden flex items-center justify-center border-2 border-slate-800">
                
                {/* Simulated camera grid */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Camera corner brackets */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-primary"></div>

                {/* Pulsing scanning line */}
                {scanStatus === "scanning" && (
                  <div className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_15px_#D96C4A] rounded animate-[scan_2.2s_infinite_ease-in-out]"></div>
                )}

                {scanStatus === "idle" && (
                  <div className="text-center text-stone-400 p-6">
                    <Camera className="h-12 w-12 mx-auto mb-3 opacity-60 text-text-secondary" />
                    <p className="text-xs">Camera Feed Ready</p>
                  </div>
                )}

                {scanStatus === "scanning" && (
                  <div className="text-center text-white">
                    <p className="text-sm font-semibold tracking-wider animate-pulse text-primary">SCANNING IN PROCESS</p>
                    <p className="text-[10px] text-stone-400 mt-1">Analyzing holographic image...</p>
                  </div>
                )}

                {scanStatus === "success" && (
                  <div className="text-center text-emerald-400 p-6 flex flex-col items-center">
                    <CheckCircle2 className="h-16 w-16 mb-3 animate-bounce" />
                    <p className="text-sm font-bold uppercase tracking-wider">HOLOGRAPHIC SUCCESS</p>
                    <p className="text-[10px] text-stone-400 mt-1 max-w-[200px] break-words">{scanResult}</p>
                  </div>
                )}
              </div>

              {scanStatus === "idle" && (
                <button
                  type="button"
                  onClick={handleStartScan}
                  className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full shadow-lg shadow-[#D96C4A]/25 transition cursor-pointer"
                >
                  Start Active Scan
                </button>
              )}

              {scanStatus === "scanning" && (
                <button
                  type="button"
                  disabled
                  className="w-full h-14 bg-stone-200 dark:bg-slate-800 text-stone-400 dark:text-slate-650 font-semibold rounded-full flex items-center justify-center gap-2"
                >
                  <div className="animate-spin h-5 w-5 border-2 border-stone-400 border-t-transparent rounded-full"></div>
                  Analyzing viewport...
                </button>
              )}

              {scanStatus === "success" && (
                <button
                  type="button"
                  onClick={handleApplyScanResult}
                  className="w-full h-14 bg-[#49654e] hover:bg-[#3b523f] text-white font-semibold rounded-full shadow-lg shadow-[#49654e]/25 transition cursor-pointer"
                >
                  Apply Scanned Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
