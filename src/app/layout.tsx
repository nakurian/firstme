import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FirstMe - AI-Powered Incident Resolution",
  description: "Automated root cause analysis and incident resolution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gray-950 text-gray-100 antialiased`}
      >
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-gray-100 hover:text-white"
            >
              FirstMe
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
