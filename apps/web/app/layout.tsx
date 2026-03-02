import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meeting Delegator",
  description: "AI-powered meeting intelligence for teams that ship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased relative`}
      >
        <div className="relative z-1">{children}</div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#0f172a", // slate-900
              color: "#f1f5f9", // slate-100
              border: "1px solid #1e293b", // slate-800 border
              borderRadius: "8px",
              fontSize: "14px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
            },
            success: {
              iconTheme: {
                primary: "#22c55e", // green-500
                secondary: "#0f172a",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444", // red-500
                secondary: "#0f172a",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
