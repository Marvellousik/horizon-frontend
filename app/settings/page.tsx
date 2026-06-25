"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, Type, Hash, Zap, Contrast, BookOpen, Shield } from "lucide-react";

interface SettingsPreferences {
  dyslexia_font: boolean;
  simplified_numbers: boolean;
  anxiety_mode: boolean;
  high_contrast_mode: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<SettingsPreferences>({
    dyslexia_font: false,
    simplified_numbers: false,
    anxiety_mode: false,
    high_contrast_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = () =>
    localStorage.getItem("access_token") ?? localStorage.getItem("accessToken");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Please login to access settings.");
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const response = await axios.get<SettingsPreferences>(
          "http://127.0.0.1:8000/api/settings/preferences/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setPreferences(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch preferences:", err);
        setError("Unable to load your settings. Please try again.");
        if (err?.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("accessToken");
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [router]);

  const handleToggle = async (
    key: keyof SettingsPreferences,
    value: boolean,
  ) => {
    const token = getToken();
    if (!token) {
      setError("Please login to update settings.");
      return;
    }

    // Optimistic update
    const previousValue = preferences[key];
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setUpdating(key);

    try {
      await axios.patch(
        "http://127.0.0.1:8000/api/settings/preferences/",
        { [key]: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      setError(null);
    } catch (err: any) {
      console.error("Failed to update preference:", err);
      // Revert optimistic update
      setPreferences((prev) => ({ ...prev, [key]: previousValue }));
      setError("Failed to update setting. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dim p-4">
        <div className="text-center">
          <span className="text-4xl animate-bounce mb-4 inline-block">⚙️</span>
          <p className="text-sm sm:text-base text-text-primary dark:text-slate-200">
            Loading your settings...
          </p>
        </div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dim p-4">
        <div className="max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8 text-red-700 shadow-sm dark:border-red-800 dark:bg-surface dark:text-red-200">
          <h2 className="mb-3 text-lg sm:text-2xl font-semibold font-serif">
            Settings error
          </h2>
          <p className="mb-4 text-xs sm:text-sm leading-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dim px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-text-primary dark:text-white mb-2 font-serif">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-text-secondary dark:text-slate-300">
            Tailor your banking experience to your needs.
          </p>
        </header>

        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* Sub-navigation */}
          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-xl bg-[#49654e] text-white font-semibold transition">
              Inclusion
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl text-text-secondary dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition">
              Profile
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl text-text-secondary dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition">
              Privacy
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl text-text-secondary dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition">
              Alerts
            </button>
          </nav>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Cognitive & Visual Accessibility Panel */}
            <div className="bg-surface dark:bg-surface rounded-2xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary dark:text-white mb-6 font-serif">
                Cognitive & Visual Accessibility
              </h2>

              <div className="space-y-4">
                {/* Dyslexia Friendly Font */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F4F1EA] dark:bg-background-dim">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Type className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary dark:text-white">
                        Dyslexia Friendly Font
                      </p>
                      <p className="text-xs text-text-secondary dark:text-slate-300">
                        Easier to read typography
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle("dyslexia_font", !preferences.dyslexia_font)
                    }
                    disabled={updating === "dyslexia_font"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.dyslexia_font
                        ? "bg-[#49654e]"
                        : "bg-stone-300 dark:bg-stone-600"
                    } ${updating === "dyslexia_font" ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
                        preferences.dyslexia_font
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Simplified Numbers */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F4F1EA] dark:bg-background-dim">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary dark:text-white">
                        Simplified Numbers
                      </p>
                      <p className="text-xs text-text-secondary dark:text-slate-300">
                        Round numbers for clarity
                      </p>
                    </div>
                  </div>
                  <div className="flex rounded-full bg-surface dark:bg-stone-700 p-1">
                    <button
                      onClick={() => handleToggle("simplified_numbers", true)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                        preferences.simplified_numbers
                          ? "bg-[#49654e] text-white"
                          : "text-text-secondary dark:text-slate-300"
                      } ${updating === "simplified_numbers" ? "opacity-50" : ""}`}
                    >
                      Simplified
                    </button>
                    <button
                      onClick={() => handleToggle("simplified_numbers", false)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                        !preferences.simplified_numbers
                          ? "bg-[#49654e] text-white"
                          : "text-text-secondary dark:text-slate-300"
                      } ${updating === "simplified_numbers" ? "opacity-50" : ""}`}
                    >
                      Exact
                    </button>
                  </div>
                </div>

                {/* Anxiety Mode */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F4F1EA] dark:bg-background-dim">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary dark:text-white">
                        Anxiety Mode
                      </p>
                      <p className="text-xs text-text-secondary dark:text-slate-300">
                        Reduced cognitive load
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle("anxiety_mode", !preferences.anxiety_mode)
                    }
                    disabled={updating === "anxiety_mode"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.anxiety_mode
                        ? "bg-[#49654e]"
                        : "bg-stone-300 dark:bg-stone-600"
                    } ${updating === "anxiety_mode" ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
                        preferences.anxiety_mode
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* High Contrast Mode */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F4F1EA] dark:bg-background-dim">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Contrast className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary dark:text-white">
                        High Contrast Mode
                      </p>
                      <p className="text-xs text-text-secondary dark:text-slate-300">
                        Better visibility
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle(
                        "high_contrast_mode",
                        !preferences.high_contrast_mode,
                      )
                    }
                    disabled={updating === "high_contrast_mode"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.high_contrast_mode
                        ? "bg-[#49654e]"
                        : "bg-stone-300 dark:bg-stone-600"
                    } ${updating === "high_contrast_mode" ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${
                        preferences.high_contrast_mode
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-[#49654e] text-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="h-6 w-6" />
                  <h3 className="font-semibold font-serif">Interactive Tutorial</h3>
                </div>
                <p className="text-sm opacity-90">
                  Learn how to use all features with guided walkthroughs.
                </p>
              </div>

              <div className="bg-[#F4F1EA] dark:bg-surface rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Eye className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-text-primary dark:text-white font-serif">
                    You're in control
                  </h3>
                </div>
                <p className="text-sm text-text-secondary dark:text-slate-300">
                  Customize every aspect of your banking experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
