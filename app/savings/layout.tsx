"use client";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function SavingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-72 fixed h-screen">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-text-primary/20 backdrop-blur-xs md:hidden"
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
      <main className="w-full md:ml-72">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-surface border-b border-border-sand px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-background-dim rounded-xl transition"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-text-primary" />
            ) : (
              <Menu className="w-6 h-6 text-text-primary" />
            )}
          </button>
          <span className="font-serif font-semibold text-text-primary">
            Savings
          </span>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* Content Area */}
        <div className="pt-16 pb-24 md:pt-0 md:pb-0">{children}</div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
