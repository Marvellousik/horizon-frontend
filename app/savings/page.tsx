"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Droplets } from "lucide-react";

interface SavingsGoal {
  id: string | number;
  name: string;
  target_amount: number;
  current_amount: number;
}

interface GoalsResponse {
  goals?: SavingsGoal[];
}

export default function SavingsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Plant New Goal Modal state
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [plantingLoading, setPlantingLoading] = useState(false);
  const [plantingError, setPlantingError] = useState<string | null>(null);

  // Water Your Plants Modal state
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | number>("");
  const [waterAmount, setWaterAmount] = useState("");
  const [wateringLoading, setWateringLoading] = useState(false);
  const [wateringError, setWateringError] = useState<string | null>(null);

  // Banking Operations Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [account_no, setAccount_no] = useState("");
  const [destination_account, setDestination_account] = useState("");
  const [amount, setAmount] = useState("");
  const [bankingLoading, setBankingLoading] = useState(false);
  const [bankingError, setBankingError] = useState<string | null>(null);

  const getToken = () =>
    localStorage.getItem("access_token") ?? localStorage.getItem("accessToken");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Please login to access your savings garden.");
      setLoading(false);
      return;
    }

    const fetchGoals = async () => {
      try {
        const response = await axios.get<GoalsResponse>(
          "http://127.0.0.1:8000/api/savings/goals/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setGoals(response.data.goals || []);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch goals:", err);
        setError("Unable to load your savings goals. Please try again.");
        if (err?.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("accessToken");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const handlePlantGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setPlantingError("Please login to create a goal.");
      return;
    }

    if (!goalName.trim()) {
      setPlantingError("Please enter a goal name.");
      return;
    }

    const amount = parseFloat(targetAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setPlantingError("Please enter a valid target amount.");
      return;
    }

    setPlantingLoading(true);
    setPlantingError(null);

    try {
      const response = await axios.post<SavingsGoal>(
        "http://127.0.0.1:8000/api/savings/goals/",
        {
          name: goalName.trim(),
          target_amount: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setGoals([...goals, response.data]);
      setGoalName("");
      setTargetAmount("");
      setShowPlantModal(false);
    } catch (err: any) {
      console.error("Failed to create goal:", err);
      setPlantingError(
        err?.response?.data?.detail ||
          "Failed to plant your goal. Please try again.",
      );
    } finally {
      setPlantingLoading(false);
    }
  };

  const handleWaterGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setWateringError("Please login to water your plants.");
      return;
    }

    if (!selectedGoalId) {
      setWateringError("Please select a goal to water.");
      return;
    }

    const amount = parseFloat(waterAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setWateringError("Please enter a valid amount.");
      return;
    }

    setWateringLoading(true);
    setWateringError(null);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/savings/goals/${selectedGoalId}/fund/`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Update the goal with the new amount
      setGoals(
        goals.map((goal) =>
          goal.id === selectedGoalId
            ? { ...goal, current_amount: response.data.current_amount }
            : goal,
        ),
      );

      setSelectedGoalId("");
      setWaterAmount("");
      setShowWaterModal(false);
    } catch (err: any) {
      console.error("Failed to fund goal:", err);
      setWateringError(
        err?.response?.data?.detail ||
          "Failed to water your plant. Please try again.",
      );
    } finally {
      setWateringLoading(false);
    }
  };

  const extractOraError = (err: any): string => {
    console.error("Banking operation failed:", err);
    const data = err?.response?.data;
    if (!data) return "Failed to process transaction. Please try again.";

    const findOraPattern = (str: string) => {
      const match = str.match(/ORA-\d+:[^"\n]*/);
      return match ? match[0] : null;
    };

    if (typeof data === "string") {
      const ora = findOraPattern(data);
      if (ora) return ora;
      return data;
    }

    const candidates = [data.error, data.detail, data.message, data.exception];
    for (const val of candidates) {
      if (typeof val === "string") {
        const ora = findOraPattern(val);
        if (ora) return ora;
      }
    }

    if (typeof data === "object") {
      for (const key of Object.keys(data)) {
        const val = data[key];
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

      for (const key of Object.keys(data)) {
        if (typeof data[key] === "string") return data[key];
      }
    }

    return "Failed to process transaction. Please try again.";
  };

  const resetBankingState = () => {
    setAccount_no("");
    setDestination_account("");
    setAmount("");
    setBankingError(null);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setBankingError("Please login to perform this action.");
      return;
    }

    if (!account_no.trim()) {
      setBankingError("Please enter an account number.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setBankingError("Please enter a valid amount.");
      return;
    }

    setBankingLoading(true);
    setBankingError(null);

    try {
      await axios.post(
        "/api/bank/proc-deposit/",
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
      resetBankingState();
      setShowDepositModal(false);
    } catch (err: any) {
      setBankingError(extractOraError(err));
    } finally {
      setBankingLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setBankingError("Please login to perform this action.");
      return;
    }

    if (!account_no.trim()) {
      setBankingError("Please enter an account number.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setBankingError("Please enter a valid amount.");
      return;
    }

    setBankingLoading(true);
    setBankingError(null);

    try {
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
      resetBankingState();
      setShowWithdrawModal(false);
    } catch (err: any) {
      setBankingError(extractOraError(err));
    } finally {
      setBankingLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setBankingError("Please login to perform this action.");
      return;
    }

    if (!account_no.trim() || !destination_account.trim()) {
      setBankingError("Please enter both source and destination accounts.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setBankingError("Please enter a valid amount.");
      return;
    }

    setBankingLoading(true);
    setBankingError(null);

    try {
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
      resetBankingState();
      setShowTransferModal(false);
    } catch (err: any) {
      setBankingError(extractOraError(err));
    } finally {
      setBankingLoading(false);
    }
  };

  const getPlantStage = (percentage: number) => {
    if (percentage < 33) return "seedling";
    if (percentage < 67) return "sprout";
    return "flower";
  };

  const renderPlantSVG = (percentage: number) => {
    const stage = getPlantStage(percentage);

    if (stage === "seedling") {
      return (
        <svg
          className="w-16 h-16 text-[#82A086]"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <path d="M50 80C50 80 40 60 40 45C40 30 50 20 50 20C50 20 60 30 60 45C60 60 50 80 50 80Z" />
          <rect fill="#6d5a41" height="15" rx="2" width="4" x="48" y="75" />
        </svg>
      );
    }

    if (stage === "sprout") {
      return (
        <svg
          className="w-16 h-16 text-[#82A086]"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="4"
          viewBox="0 0 100 100"
        >
          <path d="M50 85V40M50 60C50 60 35 55 30 45C25 35 30 25 30 25C30 25 45 30 50 45M50 65C50 65 65 60 70 50C75 40 70 30 70 30C70 30 55 35 50 50" />
          <circle cx="50" cy="40" fill="#82A086" r="3" />
        </svg>
      );
    }

    // flower
    return (
      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 100 100">
        <path
          d="M50 85V50"
          stroke="#82A086"
          strokeLinecap="round"
          strokeWidth="4"
        />
        <path
          d="M50 50C50 50 65 40 65 30C65 20 50 20 50 20C50 20 35 20 35 30C35 40 50 50 50 50Z"
          fill="#D96C4A"
        />
        <path
          d="M50 50C50 50 65 60 75 60C85 60 85 45 85 45C85 45 85 30 75 30C65 30 50 50 50 50Z"
          fill="#D96C4A"
          opacity="0.8"
        />
        <path
          d="M50 50C50 50 35 60 25 60C15 60 15 45 15 45C15 45 15 30 25 30C35 30 50 50 50 50Z"
          fill="#D96C4A"
          opacity="0.8"
        />
        <circle cx="50" cy="40" fill="#F6D55C" r="6" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f2] dark:bg-stone-900 p-4">
        <div className="text-center">
          <span className="text-4xl animate-bounce mb-4 inline-block">🌱</span>
          <p className="text-sm sm:text-base text-stone-700 dark:text-slate-200">
            Loading your garden...
          </p>
        </div>
      </div>
    );
  }

  const dailyGrowth =
    goals.reduce((sum, goal) => {
      return (
        sum + Math.min(12.4, (goal.current_amount / goal.target_amount) * 100)
      );
    }, 0) / Math.max(1, goals.length);

  return (
    <div className="min-h-screen bg-[#fcf9f2] dark:bg-stone-900">
      <div className="px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] dark:text-white mb-2">
                  Micro-Savings Garden
                </h1>
                <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300 max-w-2xl">
                  Watch your small contributions grow into something beautiful.
                  Each plot represents a financial milestone being nurtured by
                  your patience.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => {
                      resetBankingState();
                      setShowDepositModal(true);
                    }}
                    className="px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-sm font-semibold text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition shadow-sm"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => {
                      resetBankingState();
                      setShowWithdrawModal(true);
                    }}
                    className="px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-sm font-semibold text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition shadow-sm"
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={() => {
                      resetBankingState();
                      setShowTransferModal(true);
                    }}
                    className="px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-sm font-semibold text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition shadow-sm"
                  >
                    Transfer
                  </button>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-2 bg-white dark:bg-stone-800 rounded-full px-6 py-3 border border-stone-200 dark:border-stone-700 shadow-sm flex-shrink-0">
                <span className="text-xl">🌱</span>
                <span className="text-sm text-stone-600 dark:text-slate-300">
                  Daily Growth:{" "}
                  <span className="font-bold text-[#D96C4A]">
                    +${dailyGrowth.toFixed(2)}
                  </span>
                </span>
              </div>
            </div>
          </header>

          {/* Error State */}
          {error && (
            <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Goals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12">
            {goals.map((goal) => {
              const percentage =
                (goal.current_amount / goal.target_amount) * 100;
              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-[#F4F1EA] dark:bg-stone-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    {renderPlantSVG(percentage)}
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#111827] dark:text-white mb-2 sm:mb-3">
                    {goal.name}
                  </h3>
                  <div className="flex justify-between items-center mb-2 text-xs sm:text-sm">
                    <span className="text-stone-600 dark:text-slate-300">
                      Progress
                    </span>
                    <span className="font-bold text-[#D96C4A]">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-2 sm:mb-3">
                    <div
                      className="h-full bg-[#D96C4A] rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500 dark:text-slate-400 text-center">
                    ₦{goal.current_amount.toFixed(2)} / ₦
                    {goal.target_amount.toFixed(2)}
                  </p>
                </div>
              );
            })}

            {/* Plant New Goal Card */}
            <button
              onClick={() => setShowPlantModal(true)}
              className="bg-white dark:bg-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow border-2 border-dashed border-stone-300 dark:border-stone-600 flex flex-col items-center justify-center group min-h-[280px]"
            >
              <Plus className="w-8 h-8 sm:w-12 sm:h-12 text-stone-400 group-hover:text-[#D96C4A] transition-colors mb-2" />
              <span className="text-xs sm:text-base text-stone-600 dark:text-slate-300 group-hover:text-[#D96C4A] font-semibold transition-colors text-center">
                Plant New Goal
              </span>
            </button>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-2 bg-white dark:bg-stone-800 rounded-2xl p-4 sm:p-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
              <div className="text-3xl flex-shrink-0">💡</div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-[#111827] dark:text-white mb-1">
                  Did you know?
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-300">
                  Setting aside just $2 extra each day would complete your goals
                  14 days earlier. Your garden thrives on consistency!
                </p>
              </div>
            </div>
            <div className="bg-[#F4F1EA] dark:bg-stone-800 rounded-2xl p-4 sm:p-8 flex flex-col justify-center items-center text-center shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-600 dark:text-slate-400 mb-2">
                Total Goals
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#D96C4A]">
                {goals.length}
              </p>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-2">
                Growing together
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plant New Goal Modal */}
      {showPlantModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/50 p-4 md:p-6">
          <div className="bg-white dark:bg-stone-800 rounded-t-[2rem] md:rounded-[2rem] p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white mb-4 sm:mb-6">
              Plant a New Goal
            </h2>
            <form onSubmit={handlePlantGoal} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g., Emergency Fund"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Target Amount (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="1000.00"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              {plantingError && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {plantingError}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPlantModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full border border-stone-200 dark:border-stone-600 text-xs sm:text-sm text-stone-700 dark:text-slate-200 font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={plantingLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-[#D96C4A] text-xs sm:text-sm text-white font-semibold hover:bg-[#c45b3f] transition disabled:opacity-50"
                >
                  {plantingLoading ? "Planting..." : "Plant Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Water Your Plants Modal (FAB) */}
      {showWaterModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/50 p-4 md:p-6">
          <div className="bg-white dark:bg-stone-800 rounded-t-[2rem] md:rounded-[2rem] p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white mb-4 sm:mb-6">
              Water Your Plants
            </h2>
            <form onSubmit={handleWaterGoal} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Select Goal
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                >
                  <option value="">Choose a goal...</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(e.target.value)}
                  placeholder="50.00"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              {wateringError && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {wateringError}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWaterModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full border border-stone-200 dark:border-stone-600 text-xs sm:text-sm text-stone-700 dark:text-slate-200 font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={wateringLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-[#D96C4A] text-xs sm:text-sm text-white font-semibold hover:bg-[#c45b3f] transition disabled:opacity-50"
                >
                  {wateringLoading ? "Watering..." : "Water Plant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/50 p-4 md:p-6">
          <div className="bg-white dark:bg-stone-800 rounded-t-[2rem] md:rounded-[2rem] p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white mb-4 sm:mb-6">
              Deposit Funds
            </h2>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={account_no}
                  onChange={(e) => setAccount_no(e.target.value)}
                  placeholder="Enter Account Number"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              {bankingError && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {bankingError}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full border border-stone-200 dark:border-stone-600 text-xs sm:text-sm text-stone-700 dark:text-slate-200 font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankingLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-[#D96C4A] text-xs sm:text-sm text-white font-semibold hover:bg-[#c45b3f] transition disabled:opacity-50"
                >
                  {bankingLoading ? "Processing..." : "Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/50 p-4 md:p-6">
          <div className="bg-white dark:bg-stone-800 rounded-t-[2rem] md:rounded-[2rem] p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white mb-4 sm:mb-6">
              Withdraw Funds
            </h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={account_no}
                  onChange={(e) => setAccount_no(e.target.value)}
                  placeholder="Enter Account Number"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              {bankingError && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {bankingError}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full border border-stone-200 dark:border-stone-600 text-xs sm:text-sm text-stone-700 dark:text-slate-200 font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankingLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-[#D96C4A] text-xs sm:text-sm text-white font-semibold hover:bg-[#c45b3f] transition disabled:opacity-50"
                >
                  {bankingLoading ? "Processing..." : "Withdraw"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/50 p-4 md:p-6">
          <div className="bg-white dark:bg-stone-800 rounded-t-[2rem] md:rounded-[2rem] p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white mb-4 sm:mb-6">
              Transfer Funds
            </h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Source Account
                </label>
                <input
                  type="text"
                  value={account_no}
                  onChange={(e) => setAccount_no(e.target.value)}
                  placeholder="Enter Source Account"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Destination Account
                </label>
                <input
                  type="text"
                  value={destination_account}
                  onChange={(e) => setDestination_account(e.target.value)}
                  placeholder="Enter Destination Account"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-200 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-sm sm:text-base text-stone-900 dark:text-white focus:outline-none focus:border-[#D96C4A] focus:ring-2 focus:ring-[#D96C4A]/20"
                />
              </div>
              {bankingError && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {bankingError}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full border border-stone-200 dark:border-stone-600 text-xs sm:text-sm text-stone-700 dark:text-slate-200 font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankingLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-[#D96C4A] text-xs sm:text-sm text-white font-semibold hover:bg-[#c45b3f] transition disabled:opacity-50"
                >
                  {bankingLoading ? "Processing..." : "Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Watering Can FAB */}
      <button
        onClick={() => setShowWaterModal(true)}
        className="fixed bottom-6 md:bottom-8 right-4 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#D96C4A] text-white shadow-xl shadow-[#D96C4A]/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40 group"
      >
        <Droplets className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-12 right-0 bg-slate-900 text-white text-xs font-bold py-1 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Water Plants
        </div>
      </button>
    </div>
  );
}
