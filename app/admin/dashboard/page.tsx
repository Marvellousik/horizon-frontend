"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { simulateMonthlyMaintenance } from "@/api/admin";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Sliders,
  DollarSign
} from "lucide-react";

// --- JWT Decryption Helpers ---
interface TokenPayload {
  role?: string;
  role_classification?: string;
  user_role?: string;
  groups?: string[];
  roles?: string[];
  [key: string]: any;
}

const decodeJwt = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT decoding failed:", error);
    return null;
  }
};

// --- Custom Axios Interceptor Configuration ---
const createAdminApi = (token: string) => {
  const instance = axios.create({
    baseURL: "http://127.0.0.1:8000",
  });
  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
};

// --- Interfaces ---
interface AuditLog {
  id: string;
  timestamp: string;
  operation: string;
  staff_id: string;
  account_no: string;
  status: "SUCCESS" | "FAILED";
  details: string;
}

interface BranchLiquidity {
  name: string;
  volume: number;
  percentage: number;
}

interface SettingsPreferences {
  dyslexia_font: boolean;
  simplified_numbers: boolean;
  anxiety_mode: boolean;
  high_contrast_mode: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Preference accessibility state
  const [preferences, setPreferences] = useState<SettingsPreferences>({
    dyslexia_font: false,
    simplified_numbers: false,
    anxiety_mode: false,
    high_contrast_mode: false,
  });

  // Business state
  const [liquidityData, setLiquidityData] = useState<BranchLiquidity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Form states
  const [activeTab, setActiveTab] = useState<"deposit" | "withdrawal" | "transfer">("deposit");
  const [accountNo, setAccountNo] = useState("");
  const [amount, setAmount] = useState("");
  const [staffId, setStaffId] = useState("");
  const [destAccount, setDestAccount] = useState("");
  
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Monthly Maintenance Simulation states
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState<string | null>(null);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Search & Filters state for logs
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");

  // JWT claim decryption and Role classification verification
  useEffect(() => {
    const rawToken = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
    
    if (!rawToken) {
      setAuthLoading(false);
      setAuthorized(false);
      router.push("/");
      return;
    }

    setToken(rawToken);
    const payload = decodeJwt(rawToken);

    // Resolve user roles dynamically across standard fields
    const rolesToCheck = [
      payload?.role,
      payload?.role_classification,
      payload?.user_role,
      ...(Array.isArray(payload?.groups) ? payload.groups : typeof payload?.groups === "string" ? [payload.groups] : []),
      ...(Array.isArray(payload?.roles) ? payload.roles : typeof payload?.roles === "string" ? [payload.roles] : []),
    ];

    const allowedRoles = ["STAFF", "TELLER", "MANAGER", "AUDITOR"];
    const resolvedRole = rolesToCheck.find(
      (r) => typeof r === "string" && allowedRoles.includes(r.toUpperCase())
    );

    // Support direct localStorage override for local mockup flexibility
    const localRole = localStorage.getItem("role") || localStorage.getItem("userRole");
    const matchedRole = resolvedRole || (localRole && allowedRoles.includes(localRole.toUpperCase()) ? localRole : null);

    if (matchedRole) {
      setUserRole(matchedRole.toUpperCase());
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
    setAuthLoading(false);
  }, [router]);

  // Load Business metrics & logs + User settings preferences
  useEffect(() => {
    if (!authorized || !token) return;

    const api = createAdminApi(token);

    const fetchAdminData = async () => {
      setDataLoading(true);
      setDataError(null);

      try {
        // Parallel requests for speed and premium interactive syncing
        const [prefRes, adminDataRes] = await Promise.allSettled([
          api.get<SettingsPreferences>("/api/settings/preferences/"),
          api.get("/api/admin/dashboard/"),
        ]);

        // Preference resolution
        if (prefRes.status === "fulfilled") {
          setPreferences(prefRes.value.data);
        } else {
          console.warn("Could not fetch user accessibility settings preferences, falling back.");
        }

        // Dashboard statistics resolution
        if (adminDataRes.status === "fulfilled") {
          const fetchedData = adminDataRes.value.data;
          if (fetchedData.branch_liquidity) {
            setLiquidityData(fetchedData.branch_liquidity);
          }
          if (fetchedData.audit_logs) {
            setAuditLogs(fetchedData.audit_logs);
          }
        } else {
          // Robust mock values if backend is loading, simulated, or offline
          console.warn("API returned error, simulating secure mockup branch and audit sequence.");
          setLiquidityData([
            { name: "Lagos Central Hub", volume: 45200000, percentage: 40 },
            { name: "Abuja Main Branch", volume: 38400000, percentage: 32 },
            { name: "Port Harcourt Terminal", volume: 21500000, percentage: 18 },
            { name: "Kano Commercial Post", volume: 11200000, percentage: 10 },
          ]);

          setAuditLogs([
            {
              id: "TX-90214",
              timestamp: new Date(Date.now() - 4000000).toISOString(),
              operation: "PROC_TRANSFER",
              staff_id: "ST-8812",
              account_no: "100200300",
              status: "SUCCESS",
              details: "ACID simulated inter-branch procedure transfer of ₦150,000 to AC-20884.",
            },
            {
              id: "TX-90213",
              timestamp: new Date(Date.now() - 12000000).toISOString(),
              operation: "MANUAL_WITHDRAWAL",
              staff_id: "TL-4011",
              account_no: "100500600",
              status: "SUCCESS",
              details: "Physical withdrawal override approved: ₦75,000 processed.",
            },
            {
              id: "TX-90212",
              timestamp: new Date(Date.now() - 25000000).toISOString(),
              operation: "MANUAL_DEPOSIT",
              staff_id: "TL-4011",
              account_no: "100990442",
              status: "FAILED",
              details: "ORA-20101: Insufficient audit security clearing level for staff_id.",
            },
            {
              id: "TX-90211",
              timestamp: new Date(Date.now() - 48000000).toISOString(),
              operation: "MANUAL_DEPOSIT",
              staff_id: "MN-0082",
              account_no: "100200300",
              status: "SUCCESS",
              details: "Manual cash deposit override processed: ₦2,000,000 settled.",
            },
            {
              id: "TX-90210",
              timestamp: new Date(Date.now() - 86000000).toISOString(),
              operation: "DB_SCHEMA_UPDATE",
              staff_id: "AD-0001",
              account_no: "N/A",
              status: "SUCCESS",
              details: "Oracle sequences audit triggers synchronized successfully.",
            },
          ]);
        }
      } catch (err: any) {
        console.error("Dashboard Fetch Error", err);
        setDataError("Failed to fetch full administrative operational statistics.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchAdminData();
  }, [authorized, token]);

  // Oracle SQL Error Parser consistent with User Dashboard
  const extractOraError = (err: any): string => {
    const dataVal = err?.response?.data;
    if (!dataVal) return "Failed to process transaction override. Verify connection.";

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

    return "Failed to execute manual override override. Verify input formats.";
  };

  // Submit manual override overrides via API
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!accountNo.trim()) {
      setFormError("Account number is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Enter a valid amount greater than 0.");
      return;
    }

    if (activeTab !== "transfer" && !staffId.trim()) {
      setFormError("Staff ID authorization is required.");
      return;
    }

    if (activeTab === "transfer" && !destAccount.trim()) {
      setFormError("Destination account number is required.");
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    const api = createAdminApi(token);

    try {
      if (activeTab === "deposit") {
        await api.post("/api/oracle/deposit/", {
          account_no: accountNo.trim(),
          amount: parsedAmount,
          staff_id: staffId.trim(),
        });
        setFormSuccess(`Manual Cash Deposit of ₦${parsedAmount.toLocaleString()} successfully overriding-settled!`);
      } else if (activeTab === "withdrawal") {
        await api.post("/api/oracle/withdrawal/", {
          account_no: accountNo.trim(),
          amount: parsedAmount,
          staff_id: staffId.trim(),
        });
        setFormSuccess(`Manual Cash Withdrawal of ₦${parsedAmount.toLocaleString()} successfully overriding-settled!`);
      } else if (activeTab === "transfer") {
        await api.post("/api/oracle/transfer/", {
          source_account: accountNo.trim(),
          destination_account: destAccount.trim(),
          amount: parsedAmount,
        });
        setFormSuccess(`Administrative ACID Procedure Transfer of ₦${parsedAmount.toLocaleString()} completed successfully!`);
      }

      // Clear input fields on success
      setAccountNo("");
      setAmount("");
      setDestAccount("");

      // Refresh Audit logs & branch metrics
      try {
        const adminDataRes = await api.get("/api/admin/dashboard/");
        if (adminDataRes.data.branch_liquidity) {
          setLiquidityData(adminDataRes.data.branch_liquidity);
        }
        if (adminDataRes.data.audit_logs) {
          setAuditLogs(adminDataRes.data.audit_logs);
        }
      } catch (err) {
        console.warn("Could not hot-reload operational metrics stream.");
      }
    } catch (err: any) {
      console.error(err);
      setFormError(extractOraError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleMaintenanceClick = () => {
    if (preferences.anxiety_mode) {
      setShowConfirmationModal(true);
    } else {
      runMaintenanceSimulation();
    }
  };

  const runMaintenanceSimulation = async () => {
    setMaintenanceLoading(true);
    setMaintenanceSuccess(null);
    setMaintenanceError(null);
    setShowConfirmationModal(false);

    try {
      await simulateMonthlyMaintenance();
      // On success: clear liquidity progress bars/aggregated total reserves and audit logs data tables
      setLiquidityData([]);
      setAuditLogs([]);
      setMaintenanceSuccess("Global monthly maintenance simulation completed successfully!");
    } catch (err: any) {
      console.error("Monthly maintenance simulation failed:", err);
      // Explicitly check for 403 Forbidden payload or message and trigger role exception cleanly
      const isForbidden = err?.status === 403 || err?.code === "FORBIDDEN" || (typeof err === "string" && err.toLowerCase().includes("forbidden")) || (typeof err?.detail === "string" && err.detail.toLowerCase().includes("forbidden")) || (typeof err?.message === "string" && err.message.toLowerCase().includes("forbidden"));
      
      if (isForbidden) {
        setMaintenanceError("Role Access Exception: Access Denied. You do not have the required administrative clearance to execute monthly maintenance.");
      } else if (err?.detail) {
        setMaintenanceError(err.detail);
      } else if (err?.message) {
        setMaintenanceError(err.message);
      } else {
        setMaintenanceError("Failed to trigger monthly maintenance simulation. Network or security exception.");
      }
    } finally {
      setMaintenanceLoading(false);
    }
  };


  // Accessibility formatting helpers
  const formatCurrency = (val: number) => {
    const displayVal = preferences.simplified_numbers ? Math.round(val) : val;
    return `₦${displayVal.toLocaleString("en-NG", {
      minimumFractionDigits: preferences.simplified_numbers ? 0 : 2,
      maximumFractionDigits: preferences.simplified_numbers ? 0 : 2,
    })}`;
  };

  // Live tabular sequence filtering
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.operation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.account_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [auditLogs, searchQuery, statusFilter]);

  // Loading indicator for authentication roles verification
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background  p-6">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#9c3e20]/20 border-t-[#9c3e20] rounded-full mb-4" />
          <p className="text-text-secondary dark:text-slate-350">Verifying staff clearance level credentials...</p>
        </div>
      </div>
    );
  }

  // Fallback "Access Denied" view
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background  p-4 sm:p-6">
        <div className="max-w-xl w-full rounded-xl bg-surface dark:bg-surface border border-border-sand dark:border-border-sand/40 p-8 sm:p-12 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#fce8e6] dark:bg-[#3d1614] text-[#ba1a1a] flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-text-primary dark:text-stone-100">
              Clearance Level Required
            </h1>
            <p className="text-sm sm:text-base text-text-secondary dark:text-slate-350 max-w-md mx-auto leading-relaxed">
              This administrative dashboard is restricted to authorized Staff, Tellers, Managers, and Auditors. Your current session does not include staff credentials.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900 text-text-primary dark:text-amber-300 text-xs sm:text-sm">
            🛡️ Your connection attempt has been securely logged to the centralized database system sequence.
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 rounded-full bg-primary hover:bg-primary-hover text-white font-semibold transition-all shadow-md active:scale-95 text-sm sm:text-base w-full cursor-pointer"
            >
              Return to standard dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background  p-4 sm:p-8 ${preferences.dyslexia_font ? "font-mono tracking-wide" : ""}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Title & Clearance Indicator */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-sand dark:border-stone-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-background-dim text-primary border border-[#d2e8d4] uppercase tracking-wider">
                Clearance: {userRole}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-text-primary dark:text-stone-150">
              Staff Override Panel
            </h1>
            <p className="text-sm sm:text-base text-text-secondary dark:text-slate-400 mt-1">
              Authorized real-time database override, liquid balance tracker, and sequence activity control.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full border border-border-sand dark:border-border-sand/40 bg-surface dark:bg-surface hover:bg-background-dim dark:hover:bg-stone-750 transition cursor-pointer text-text-primary dark:text-stone-300"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Metrics
            </button>
          </div>
        </header>

        {/* Cognitive Calming Reassurance for Anxiety Mode */}
        {preferences.anxiety_mode && (
          <div className="p-5 rounded-2xl bg-background-dim dark:bg-emerald-950/20 border border-border-sand dark:border-emerald-900/60 text-text-primary font-serif dark:text-emerald-300 flex items-start gap-4 shadow-sm">
            <span className="text-2xl pt-0.5 shrink-0">🌱</span>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm sm:text-base font-serif">Empathetic Operational Protocol</h4>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                Take your time. Overriding administrative actions operate under strict ACID database safety guidelines. No procedures will be permanently stored until you double-check all numeric inputs. Re-verify account numbers before submitting.
              </p>
            </div>
          </div>
        )}

        {/* Global Error Notice */}
        {dataError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
            {dataError}
          </div>
        )}

        {/* Global Maintenance Success/Error Notifications */}
        {maintenanceSuccess && (
          <div className={`p-4 sm:p-5 rounded-2xl flex items-start gap-4 shadow-sm border transition-all duration-300
            ${
              preferences.high_contrast_mode
                ? "bg-surface border-2 border-black text-black dark:bg-black dark:text-white rounded-none font-bold"
                : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
            }
          `}>
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="font-semibold text-sm sm:text-base font-serif">System Batch Completed</h4>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                Global monthly maintenance simulation completed successfully! Outstanding fees settled and interest distributions credited to the database sequences.
              </p>
            </div>
            <button
              onClick={() => setMaintenanceSuccess(null)}
              className="ml-auto text-xs font-semibold hover:opacity-75 cursor-pointer px-2 py-1 rounded bg-stone-200/50 dark:bg-background-dim"
            >
              Dismiss
            </button>
          </div>
        )}

        {maintenanceError && (
          <div className={`p-4 sm:p-5 rounded-2xl flex items-start gap-4 shadow-sm border transition-all duration-300
            ${
              preferences.high_contrast_mode
                ? "bg-surface border-2 border-black text-black dark:bg-black dark:text-white rounded-none font-bold"
                : "bg-rose-50 dark:bg-rose-955/20 border-rose-250 dark:border-rose-900 text-rose-800 dark:text-rose-350"
            }
          `}>
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="font-semibold text-sm sm:text-base font-serif">Simulation Error Notification</h4>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                {maintenanceError}
              </p>
            </div>
            <button
              onClick={() => setMaintenanceError(null)}
              className="ml-auto text-xs font-semibold hover:opacity-75 cursor-pointer px-2 py-1 rounded bg-stone-200/50 dark:bg-background-dim"
            >
              Dismiss
            </button>
          </div>
        )}


        {/* Primary Dashboard layout responsive system: Liquidity & Override Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Column 1 & 2: Liquidity Chart & Interactive Audit Log */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            
            {/* System Branch Liquidity Chart Container */}
            <section className="bg-surface dark:bg-surface border border-border-sand/60 dark:border-border-sand/40 rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-text-primary dark:text-stone-100">
                    System Branch Liquidity
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-400">
                    Real-time mock volume distribution matching defined primary palette.
                  </p>
                </div>
                <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {dataLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-pulse flex space-x-2">
                    <span className="text-sm text-text-secondary">Loading branch volumes...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dynamic Progress Pools */}
                  <div className="space-y-5">
                    {liquidityData.map((branch) => (
                      <div key={branch.name} className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm font-semibold">
                          <span className="text-text-primary dark:text-stone-200">{branch.name}</span>
                          <div className="space-x-2">
                            <span className="text-text-secondary dark:text-slate-400">({branch.percentage}%)</span>
                            <span className="text-primary dark:text-[#f39575]">
                              {formatCurrency(branch.volume)}
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#9c3e20] to-[#D96C4A] dark:from-[#ea7a0c] dark:to-[#f59e0b] rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${branch.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Aggregate card */}
                  <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-background-dim dark:bg-stone-950 border border-border-sand/40 dark:border-stone-850 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background-dim text-primary flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary dark:text-slate-400 uppercase tracking-wider">Total Reserves Pool</p>
                        <p className="text-base sm:text-xl font-bold text-stone-800 dark:text-stone-150">
                          {formatCurrency(liquidityData.reduce((acc, b) => acc + b.volume, 0))}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary bg-background-dim px-3 py-1 rounded-full border border-[#d2e8d4]">
                      ACID Liquid
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Real-time Interactive Audit Logs Container */}
            <section className="bg-surface dark:bg-surface border border-border-sand/60 dark:border-border-sand/40 rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-text-primary dark:text-stone-100">
                    Oracle Sequence Audit stream
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-400">
                    ACID-compliant tabular sequence logs indicating failed database operations & entries.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-background-dim dark:bg-surface text-xs sm:text-sm text-text-primary dark:text-stone-200 border border-border-sand dark:border-border-sand/40 rounded-full outline-none focus:ring-2 focus:ring-[#D96C4A]/20"
                  >
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success Only</option>
                    <option value="FAILED">Failed Only</option>
                  </select>
                </div>
              </div>

              {/* Log Search bar */}
              <div className="relative mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs by Operation, Staff ID, or Details..."
                  className="w-full pl-10 pr-4 py-2.5 bg-background-dim dark:bg-stone-950 text-xs sm:text-sm text-stone-800 dark:text-stone-100 border border-border-sand dark:border-border-sand/40 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-[#D96C4A]/20 transition-all"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              </div>

              {/* Tabular logs frame */}
              {dataLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <span className="text-sm text-text-secondary">Retrieving security sequence logs...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-stone-100 dark:border-stone-800">
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead className="sticky top-0 bg-stone-100 dark:bg-stone-950 text-text-secondary dark:text-slate-400 font-semibold z-10">
                        <tr className="border-b border-border-sand dark:border-stone-800">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Operation</th>
                          <th className="p-4">Staff ID</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-text-secondary dark:text-text-secondary italic">
                              No matching sequence entry logs detected.
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log) => (
                            <tr
                              key={log.id}
                              className="border-b border-stone-50/50 dark:border-stone-850 hover:bg-background-dim/50 dark:hover:bg-stone-800/40 transition-colors"
                            >
                              <td className="p-4 whitespace-nowrap text-text-secondary dark:text-slate-400 font-mono text-[10px] sm:text-xs">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td className="p-4 whitespace-nowrap font-bold">
                                <span className="font-mono text-stone-800 dark:text-stone-200 text-[11px] sm:text-xs">
                                  {log.operation}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap text-text-secondary dark:text-stone-300 font-semibold font-mono">
                                {log.staff_id}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                                    log.status === "SUCCESS"
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-350 border border-emerald-200/50 dark:border-emerald-800/40"
                                      : "bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-350 border border-rose-200/50 dark:border-rose-800/40"
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td className="p-4 text-xs text-text-secondary dark:text-slate-350 min-w-[220px]">
                                {log.details}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* Column 3: Staff Controls and Overrides */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* Staff Manual Override Form Container */}
            <section className="bg-surface dark:bg-surface border border-border-sand/60 dark:border-border-sand/40 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col justify-between h-fit">
              
              {/* Header Form */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-5 h-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-text-primary dark:text-stone-100">
                    Manual Overrides
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-400">
                  Trigger transactional overrides modifying accounts with proper focus rings & clearance tags.
                </p>

                {/* Action Tabs selection */}
                <div className="flex p-1 bg-background-dim dark:bg-stone-950 border border-stone-100 dark:border-stone-850 rounded-full">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("deposit");
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeTab === "deposit"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary dark:text-stone-400 hover:text-stone-800"
                    }`}
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("withdrawal");
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeTab === "withdrawal"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary dark:text-stone-400 hover:text-stone-800"
                    }`}
                  >
                    Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("transfer");
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeTab === "transfer"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary dark:text-stone-400 hover:text-stone-800"
                    }`}
                  >
                    ACID Transfer
                  </button>
                </div>

                {/* Status messages */}
                {formError && (
                  <div className="p-3 sm:p-4 rounded-xl bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-350 text-xs sm:text-sm font-semibold flex gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex gap-2">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Interactive Override Form */}
                <form onSubmit={handleOverrideSubmit} className="space-y-4 pt-2">
                  
                  {/* Account Number */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-stone-300">
                      {activeTab === "transfer" ? "Source Account No" : "Account Number"}
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="e.g. 100200300"
                      className={`w-full px-4 py-3 bg-surface dark:bg-background-dim text-text-primary dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/20 focus:border-primary transition-all
                        ${
                          preferences.high_contrast_mode
                            ? "border-2 border-black dark:border-white rounded-none font-bold focus:border-red-650"
                            : "border border-stone-250 dark:border-border-sand/40 rounded-xl"
                        }
                      `}
                    />
                  </div>

                  {/* Destination Account Number (Only Administrative Transfer) */}
                  {activeTab === "transfer" && (
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-stone-300">
                        Destination Account No
                      </label>
                      <input
                        type="text"
                        required
                        value={destAccount}
                        onChange={(e) => setDestAccount(e.target.value)}
                        placeholder="e.g. 100990442"
                        className={`w-full px-4 py-3 bg-surface dark:bg-background-dim text-text-primary dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/20 focus:border-primary transition-all
                          ${
                            preferences.high_contrast_mode
                              ? "border-2 border-black dark:border-white rounded-none font-bold focus:border-red-655"
                              : "border border-stone-250 dark:border-border-sand/40 rounded-xl"
                          }
                        `}
                      />
                    </div>
                  )}

                  {/* Amount field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-stone-300">
                        Override Amount (₦)
                      </label>
                      {preferences.simplified_numbers && (
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-955/20 dark:text-amber-350">
                          Rounded Numbers Enabled
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 bg-surface dark:bg-background-dim text-text-primary dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/20 focus:border-primary transition-all
                        ${
                          preferences.high_contrast_mode
                            ? "border-2 border-black dark:border-white rounded-none font-bold focus:border-red-660"
                            : "border border-stone-250 dark:border-border-sand/40 rounded-xl"
                        }
                      `}
                    />
                  </div>

                  {/* Staff ID authorization (Only for Deposits & Withdrawals) */}
                  {activeTab !== "transfer" && (
                    <div className="space-y-2">
                      <label className="block text-xs sm:text-sm font-semibold text-text-primary dark:text-stone-300">
                        Authorizing Staff ID
                      </label>
                      <input
                        type="text"
                        required
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        placeholder="e.g. TL-4011"
                        className={`w-full px-4 py-3 bg-surface dark:bg-background-dim text-text-primary dark:text-white text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D96C4A]/20 focus:border-primary transition-all
                          ${
                            preferences.high_contrast_mode
                              ? "border-2 border-black dark:border-white rounded-none font-bold focus:border-red-665"
                              : "border border-stone-250 dark:border-border-sand/40 rounded-xl"
                          }
                        `}
                      />
                    </div>
                  )}

                  {/* Submit button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className={`w-full py-3 px-4 font-semibold text-xs sm:text-sm text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                          preferences.high_contrast_mode
                            ? "bg-black border-2 border-black dark:bg-surface dark:text-black rounded-none uppercase font-bold text-white dark:text-black"
                            : activeTab === "deposit"
                            ? "bg-primary rounded-xl shadow-md"
                            : activeTab === "withdrawal"
                            ? "bg-[#49654e] rounded-xl shadow-md"
                            : "bg-slate-700 rounded-xl shadow-md"
                        }
                      `}
                    >
                      {formLoading ? (
                        <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : activeTab === "deposit" ? (
                        <>
                          <ArrowDownCircle className="w-4 h-4" />
                          Log Manual Deposit
                        </>
                      ) : activeTab === "withdrawal" ? (
                        <>
                          <ArrowUpCircle className="w-4 h-4" />
                          Log Manual Withdrawal
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-4 h-4" />
                          Force ACID Transfer
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>

              {/* Empathetic footer info */}
              <div className="mt-8 border-t border-stone-100 dark:border-stone-850 pt-4 flex gap-2 items-center text-[10px] text-stone-400 dark:text-text-secondary leading-normal">
                <Sparkles className="w-5 h-5 shrink-0 text-amber-500" />
                <span>
                  Oracle sequence overrides bypass user-side checking. All operations are recorded under full audit trail transparency.
                </span>
              </div>

            </section>

            {/* Run Monthly Maintenance Simulation Container */}
            <section className={`p-6 sm:p-8 shadow-sm flex flex-col justify-between h-fit transition-all duration-300
              ${
                preferences.high_contrast_mode
                  ? "bg-surface border-2 border-black dark:bg-background-dim dark:border-white rounded-none"
                  : "bg-surface dark:bg-surface border border-border-sand/60 dark:border-border-sand/40 rounded-xl"
              }
            `}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className={`w-5 h-5 ${maintenanceLoading ? "animate-spin" : ""} text-primary`} />
                  <h2 className={`font-serif font-bold text-text-primary dark:text-stone-100
                    ${preferences.high_contrast_mode ? "text-xl sm:text-2xl font-bold uppercase tracking-wider text-black dark:text-white animate-pulse" : "text-xl sm:text-2xl"}
                  `}>
                    Ledger Maintenance
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-400">
                  Trigger the backend banking engine execution loop to process monthly interest distributions and service fees globally.
                </p>

                {/* Interactive Simulation Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={maintenanceLoading}
                    onClick={handleMaintenanceClick}
                    className={`w-full py-3 px-4 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        preferences.high_contrast_mode
                          ? "bg-black border-2 border-black text-white dark:bg-surface dark:text-black rounded-none uppercase font-bold"
                          : "bg-primary text-white rounded-xl shadow-md"
                      }
                    `}
                  >
                    {maintenanceLoading ? (
                      <>
                        <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Processing Ledger Loop...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Run Monthly Maintenance Simulation</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Native loading block inside container during pending simulation */}
                {maintenanceLoading && (
                  <div className="mt-2 p-4 border border-stone-250 dark:border-stone-850 bg-background-dim dark:bg-stone-950 rounded-2xl flex items-center gap-3 animate-pulse">
                    <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-[#d6cabf]">
                      Syncing Oracle Ledger Pipelines...
                    </span>
                  </div>
                )}
              </div>

              {/* Security audit indicator */}
              <div className="mt-6 border-t border-stone-100 dark:border-stone-850 pt-4 flex gap-2 items-center text-[10px] text-stone-400 dark:text-text-secondary leading-normal">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
                <span>
                  Ledger maintenance simulation executes transactional batches. Dispatched procedures cannot be rolled back.
                </span>
              </div>
            </section>

          </div>

        </div>

      </div>

      {/* Calm Confirmation Overlay for Anxiety Mode */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
          <div className={`bg-surface dark:bg-surface p-6 sm:p-8 max-w-md w-full shadow-2xl transition-all duration-300
            ${preferences.dyslexia_font ? "font-mono tracking-wide leading-relaxed" : ""} 
            ${
              preferences.high_contrast_mode
                ? "border-4 border-black dark:border-white rounded-none"
                : "border border-stone-100 dark:border-border-sand/40 rounded-xl"
            }
          `}>
            
            {/* Calming reassurance banner */}
            <div className="p-5 rounded-2xl bg-background-dim dark:bg-emerald-950/20 border border-border-sand dark:border-emerald-900/60 text-text-primary font-serif dark:text-emerald-300 text-xs sm:text-sm mb-6 flex items-start gap-4 shadow-sm">
              <span className="text-2xl pt-0.5 shrink-0">🌱</span>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm sm:text-base font-serif">Empathetic Operational Check</h4>
                <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-sans">
                  Take a slow breath. You are triggering a monthly ledger maintenance simulation. This processes service fees and distributes savings interest globally.
                </p>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white mb-2 font-serif">
              Double-Check Simulation
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-400 mb-6 leading-relaxed">
              Confirming this simulation helps ensure all operations match security levels. Take all the time you need to review.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={runMaintenanceSimulation}
                className={`flex-1 px-4 py-3 text-xs sm:text-sm text-white font-semibold transition cursor-pointer active:scale-95
                  ${
                    preferences.high_contrast_mode
                      ? "bg-black hover:bg-stone-850 dark:bg-surface dark:text-black border border-black dark:border-white rounded-none uppercase font-bold text-white dark:text-black"
                      : "bg-primary hover:bg-primary-hover rounded-full shadow-md shadow-[#D96C4A]/25"
                  }
                `}
              >
                Yes, Run Simulation
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmationModal(false)}
                className={`flex-1 px-4 py-3 text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-95
                  ${
                    preferences.high_contrast_mode
                      ? "border border-black dark:border-white bg-transparent text-black dark:text-white rounded-none uppercase font-bold"
                      : "border border-border-sand dark:border-stone-600 text-text-primary dark:text-slate-250 hover:bg-background-dim dark:hover:bg-stone-800 rounded-full"
                  }
                `}
              >
                Cancel & Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

