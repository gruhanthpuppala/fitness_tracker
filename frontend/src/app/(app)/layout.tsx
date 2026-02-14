"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAuthenticated } from "@/lib/auth";
import Skeleton from "@/components/ui/Skeleton";
import BottomTabBar from "@/components/layout/BottomTabBar";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated() && !user) {
      router.push("/login");
      return;
    }

    if (user && !user.is_email_verified) {
      router.push("/verify-email");
      return;
    }

    if (user && !user.is_onboarded) {
      router.push("/setup");
      return;
    }

    setReady(true);
  }, [user, loading, router, pathname]);

  if (loading || !ready) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
      </main>
      <BottomTabBar />
    </div>
  );
}
