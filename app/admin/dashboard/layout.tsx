"use client";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#FAFAF8] dark:bg-[#020617]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-72 fixed h-screen">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-56 z-40 transform transition-transform md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="w-full md:ml-72">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
            aria-label="Toggle Navigation Menu"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-stone-700 dark:text-slate-200" />
            ) : (
              <Menu className="w-6 h-6 text-stone-700 dark:text-slate-200" />
            )}
          </button>
          <span className="font-semibold text-stone-900 dark:text-white">
            Staff Panel
          </span>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* Content Area */}
        <div className="pt-16 pb-24 md:pt-0 md:pb-0">{children}</div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
