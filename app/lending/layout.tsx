"use client";

export default function LendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dim">
      {children}
    </div>
  );
}