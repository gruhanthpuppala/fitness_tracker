import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness Tracker",
  description: "Personal fitness tracking for discipline and progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
