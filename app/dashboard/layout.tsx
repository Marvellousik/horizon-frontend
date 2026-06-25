"use client";

import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <Sidebar />
      <div className="flex-1 md:ml-72 pt-16 pb-20 md:pt-0 md:pb-0 w-full">{children}</div>
    </div>
  );
}
