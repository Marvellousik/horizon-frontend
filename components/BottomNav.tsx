"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Send,
  PiggyBank,
  Settings,
  Heart,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/accounts",
    icon: Wallet,
    label: "Accounts",
  },
  {
    href: "/savings",
    icon: PiggyBank,
    label: "Savings",
  },
  {
    href: "/accounts/community/lending",
    icon: Heart,
    label: "Community",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
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
          console.error("Failed to parse token in bottom nav:", e);
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

  const isUnderAdmin = pathname.startsWith("/admin");
  const visibleNavItems = isUnderAdmin
    ? [{ href: "/admin/dashboard", icon: Shield, label: "Staff" }]
    : isStaff
      ? [...navItems, { href: "/admin/dashboard", icon: Shield, label: "Staff" }]
      : navItems;

  return (
    <nav className="fixed bottom-0 left-0 w-full md:hidden z-45 flex justify-around items-center px-2 pt-2 pb-4 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border-t border-stone-200 dark:border-stone-700 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              isActive
                ? "text-[#D96C4A]"
                : "text-stone-600 dark:text-slate-400"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}