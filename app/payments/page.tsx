"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentsPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("Gift");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("accessToken");
    const storedUsername = window.localStorage.getItem("username");

    if (!token) {
      router.push("/");
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }

    fetchBalance(token);
  }, [router]);

  const fetchBalance = async (token: string) => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/dashboard/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setAvailableBalance(response.data.savings_balance ?? null);
      if (response.data.username) {
        setUsername(response.data.username);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("username");
        router.push("/");
      } else {
        console.error("Balance fetch error:", err);
      }
    }
  };

  const handleConfirmTransfer = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      router.push("/");
      return;
    }

    if (!recipient.trim()) {
      setErrorMessage("Please enter a recipient email or handle.");
      return;
    }

    if (!accountNumber.trim()) {
      setErrorMessage("Please enter an account number.");
      return;
    }

    const numericAmount = parseFloat(amount.replace(/,/g, ""));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than zero.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/transfer/",
        {
          recipient_email: recipient.trim(),
          recipient: recipient.trim(),
          account_number: accountNumber.trim(),
          amount: numericAmount,
          purpose,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setSuccessMessage("Transfer Successful");
      setErrorMessage(null);
      setRecipient("");
      setAccountNumber("");
      setAmount("");
      setPurpose("Gift");
      await fetchBalance(token);
      console.log("Transfer response:", response.data);
    } catch (err: any) {
      const incomingError =
        err.response?.data?.detail || err.response?.data?.error || err.message;
      setErrorMessage(String(incomingError));
      setSuccessMessage(null);
      console.error("Transfer failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcf9f2] px-6 py-10 md:px-10 lg:px-12 dark:bg-[#020617]">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#49654e]">
            Payments
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#111827] dark:text-slate-100">
                Payments & Transfers
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-slate-300">
                Move your money with ease and intention. We&apos;ve simplified
                the process so you can focus on the impact of your support.
              </p>
            </div>
            {availableBalance !== null ? (
              <div className="rounded-3xl border border-[#d8d2c8] bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500 dark:text-slate-400">
                  Available balance
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#10331C] dark:text-slate-100">
                  ₦
                  {availableBalance.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            ) : null}
          </div>
        </header>

        <section className="space-y-4">
          <h3 className="font-label-md text-stone-500 uppercase tracking-[0.24em]">
            Send it fast
          </h3>
          <div className="flex items-center gap-6 overflow-x-auto pb-4">
            <button className="flex flex-col items-center gap-3 shrink-0 rounded-3xl border border-dashed border-[#d8d2c8] dark:border-slate-700 bg-white dark:bg-slate-900/50 px-5 py-4 text-sm text-stone-600 dark:text-slate-300 transition hover:border-[#9c3e20] hover:text-[#9c3e20] dark:hover:border-[#D96C4A] dark:hover:text-[#D96C4A]">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#d8d2c8] text-2xl text-[#9c3e20]">
                +
              </span>
              Add New
            </button>
            {[
              { label: "MJ", name: "Mama J." },
              { label: "UL", name: "Uncle Leo" },
              { label: "SR", name: "Sam R." },
              { label: "EV", name: "Elena V." },
              { label: "KB", name: "Kai B." },
            ].map((contact) => (
              <div
                key={contact.name}
                className="flex flex-col items-center gap-3 shrink-0 cursor-pointer"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d8eddb] text-[#224523] text-lg font-semibold shadow-sm dark:bg-slate-800 dark:text-slate-100">
                  {contact.label}
                </div>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  {contact.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-8">
          <section className="rounded-[2rem] border border-[#e5e2db] bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-[#111827] dark:text-slate-100">
                  New Transfer
                </h2>
                <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
                  Send money instantly to a recipient email or handle.
                </p>
              </div>
              <span className="material-symbols-outlined text-[#D96C4A]">
                send
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 dark:text-slate-200">
                  Recipient
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="Name, @handle, or email"
                    className="w-full h-14 rounded-xl border border-[#dcdad3] bg-[#fcf9f2] px-4 pr-12 text-sm text-[#111827] outline-none transition focus:border-[#9c3e20] focus:ring-2 focus:ring-[#9c3e20]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                    person_search
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700 dark:text-slate-200">
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    placeholder="Enter account number"
                    className="w-full h-14 rounded-xl border border-[#dcdad3] bg-[#fcf9f2] px-4 pr-12 text-sm text-[#111827] outline-none transition focus:border-[#9c3e20] focus:ring-2 focus:ring-[#9c3e20]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">
                    account_balance
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700 dark:text-slate-200">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full h-14 rounded-xl border border-[#dcdad3] bg-[#fcf9f2] pl-10 pr-4 text-sm text-[#111827] outline-none transition focus:border-[#9c3e20] focus:ring-2 focus:ring-[#9c3e20]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-700 dark:text-slate-200">
                    Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    className="w-full h-14 rounded-xl border border-[#dcdad3] bg-[#fcf9f2] px-4 text-sm text-[#111827] outline-none transition focus:border-[#9c3e20] focus:ring-2 focus:ring-[#9c3e20]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option>Gift</option>
                    <option>Support</option>
                    <option>Shared Expense</option>
                    <option>Gratitude</option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-[#d7e6d8] bg-[#eaf5e9] p-4 text-sm text-[#344f36] dark:border-slate-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-[#49654e] dark:text-emerald-400">
                    info
                  </span>
                  <p>
                    This transfer will arrive instantly. No fees, just
                    appreciation.
                  </p>
                </div>
              </div>

              {successMessage ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="w-full h-14 rounded-xl bg-[#9c3e20] text-white text-base font-semibold shadow-lg shadow-[#9c3e20]/20 transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Processing transfer..." : "Confirm Transfer"}
              </button>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-[#e5e2db] bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-[#111827] dark:text-slate-100">
                Upcoming Bills
              </h2>
              <span className="material-symbols-outlined text-[#49654e]">
                event_repeat
              </span>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Community Fiber",
                  due: "Due in 3 days • Oct 15",
                  amount: "₦45.00",
                  icon: "wifi",
                },
                {
                  title: "Rent Support",
                  due: "Due in 5 days • Oct 17",
                  amount: "₦1,200.00",
                  icon: "home_work",
                },
                {
                  title: "Clean Energy Co.",
                  due: "Due in 12 days • Oct 24",
                  amount: "₦82.40",
                  icon: "electric_bolt",
                },
              ].map((bill) => (
                <div
                  key={bill.title}
                  className="group flex items-center justify-between gap-4 rounded-3xl border border-[#f0ece6] p-4 transition hover:bg-[#f8f4ee] dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#f1f0ed] text-[#5b5b54] dark:bg-slate-900 dark:text-slate-300">
                      <span className="material-symbols-outlined">
                        {bill.icon}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#111827] dark:text-slate-100">
                        {bill.title}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-slate-400">
                        {bill.due}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#111827] dark:text-slate-100">
                      {bill.amount}
                    </p>
                    <button className="text-sm font-semibold text-[#9c3e20] hover:underline">
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-8 w-full rounded-3xl border border-[#49654e] py-4 text-sm font-semibold text-[#49654e] transition hover:bg-[#49654e]/5 dark:border-slate-500 dark:text-slate-200">
              Manage All Scheduled Payments
            </button>
          </aside>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-[#dcdad3] bg-[#f6f3ec] p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-[#354c3e]">
              Encrypted Peace of Mind
            </p>
            <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">
              Every transfer is protected by world-class security, so you can
              send with confidence.
            </p>
          </div>
          <div className="rounded-[2rem] border border-[#dcdad3] bg-[#e6f4e7] p-6 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-semibold text-[#1d442b]">Planned Care</p>
            <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">
              Set up recurring gifts or payments to automate your intentions
              effortlessly.
            </p>
          </div>
          <div className="rounded-[2rem] border border-[#dcdad3] bg-[#fbe8e1] p-6 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-semibold text-[#7a2f1b]">
              Impact Tracking
            </p>
            <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">
              See how your shared expenses and gifts have supported your
              community this month.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
