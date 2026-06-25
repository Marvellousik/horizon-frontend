import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Horizon Inclusion",
  description: "Community-driven micro-lending platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#F8F4ED] text-[#2E2B28] dark:bg-[#1C1E1A] dark:text-[#FAF8F4]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

