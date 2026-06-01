"use client";

import {
  LayoutDashboard,
  Wallet,
  Send,
  PiggyBank,
  Sparkles,
  Settings,
  LogOut,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const checkStaffRole = () => {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token");
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
            const payload = JSON.parse(jsonPayload);
            const rolesToCheck = [
              payload.role,
              payload.role_classification,
              payload.user_role,
              ...(Array.isArray(payload.groups) ? payload.groups : typeof payload.groups === "string" ? [payload.groups] : []),
              ...(Array.isArray(payload.roles) ? payload.roles : typeof payload.roles === "string" ? [payload.roles] : [])
            ];
            const allowedRoles = ["STAFF", "TELLER", "MANAGER", "AUDITOR"];
            const hasStaff = rolesToCheck.some((r) => typeof r === "string" && allowedRoles.includes(r.toUpperCase()));
            if (hasStaff) {
              setIsStaff(true);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to parse token in sidebar:", e);
        }
      }
      
      const localRole = localStorage.getItem("role") || localStorage.getItem("userRole");
      if (localRole && ["STAFF", "TELLER", "MANAGER", "AUDITOR"].includes(localRole.toUpperCase())) {
        setIsStaff(true);
      } else {
        setIsStaff(false);
      }
    };

    checkStaffRole();
    
    // Listen for storage updates
    window.addEventListener("storage", checkStaffRole);
    return () => window.removeEventListener("storage", checkStaffRole);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");
    router.push("/");
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: Wallet,
    },
    {
      name: "Payments",
      href: "/payments",
      icon: Send,
    },
    {
      name: "Savings",
      href: "/savings",
      icon: PiggyBank,
    },
    {
      name: "Oracle Home",
      href: "/oracle",
      icon: Sparkles,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const isUnderAdmin = pathname.startsWith("/admin");
  const visibleNavItems = isUnderAdmin
    ? [{ name: "Staff Panel", href: "/admin/dashboard", icon: Shield }]
    : isStaff
      ? [...navItems, { name: "Staff Panel", href: "/admin/dashboard", icon: Shield }]
      : navItems;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col py-8 bg-[#fbfbf8] text-[#3c3730] dark:bg-[#100f0d] dark:text-[#f8eee4] w-72 border-r border-[#e5e2db] dark:border-[#1c1a18] z-50">
        {/* Logo */}
        <div className="px-8 mb-12 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#D96C4A] flex items-center justify-center text-white font-bold text-lg">
            H
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-[#FDE0D2] font-serif italic leading-none">
              Horizon
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#786c62] dark:text-[#d6cabf] mt-1">
              Inclusion
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-full px-6 py-4 mx-4 transition-all duration-300 ${
                    isActive
                      ? "bg-[#D96C4A] text-white shadow-lg shadow-[#D96C4A]/20"
                      : "text-[#786c62] dark:text-[#d6cabf] hover:bg-[#eae8e3] dark:hover:bg-[#1b1917]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-lg">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="border-t border-[#e5e2db] dark:border-[#1c1a18] pt-6 px-6">
          <button
            onClick={handleToggleTheme}
            className="mb-4 flex w-full items-center justify-between rounded-full border border-[#d2ccc4] bg-[#f5f3ee] dark:border-[#2a2521] dark:bg-[#1b1917] px-5 py-4 text-sm font-semibold text-[#5a5046] dark:text-[#eee1d3] transition hover:bg-[#eae6de] dark:hover:bg-[#2a2521]"
          >
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-4 text-[#786c62] dark:text-[#e7d8c8] px-6 py-4 rounded-full hover:bg-[#eae8e3] dark:hover:bg-[#1a1816] transition-all duration-300 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-lg">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#fbfbf8] border-b border-[#e5e2db] dark:bg-[#100f0d] dark:border-[#1c1a18] z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#D96C4A] flex items-center justify-center text-white font-bold text-sm">
            H
          </div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-[#FDE0D2] font-serif italic leading-none">
            Horizon
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleTheme}
            className="text-[#786c62] dark:text-[#eee1d3] hover:text-[#D96C4A] dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleSignOut}
            className="text-[#786c62] dark:text-[#eee1d3] hover:text-[#D96C4A] dark:hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#fbfbf8] border-t border-[#e5e2db] dark:bg-[#100f0d] dark:border-[#1c1a18] z-50 flex items-center justify-around p-2 pb-safe">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-14 gap-1 rounded-xl transition-all duration-300 ${
                isActive ? "text-[#D96C4A]" : "text-[#786c62] dark:text-[#d6cabf] hover:text-[#D96C4A] dark:hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
