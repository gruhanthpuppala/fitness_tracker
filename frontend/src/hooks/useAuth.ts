"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setTokens, clearTokens, getRefreshToken, getAccessToken } from "@/lib/auth";
import type { User, AuthTokens } from "@/types/user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/users/me/");
      const userData = res.data.data || res.data;
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken() || getRefreshToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login/", { email, password });
    const tokens: AuthTokens = res.data.data || res.data;
    setTokens(tokens);
    const userData = await fetchUser();
    return userData;
  };

  const register = async (email: string, password: string, password_confirm: string) => {
    await api.post("/auth/register/", { email, password, password_confirm });
  };

  const loginWithGoogle = async (token: string) => {
    const res = await api.post("/auth/google/", { token });
    const tokens: AuthTokens = res.data.data || res.data;
    setTokens(tokens);
    const userData = await fetchUser();
    return userData;
  };

  const logout = async () => {
    try {
      const refresh = getRefreshToken();
      if (refresh) {
        await api.post("/auth/logout/", { refresh });
      }
    } catch {
      // Ignore errors on logout
    } finally {
      clearTokens();
      setUser(null);
      router.push("/login");
    }
  };

  const resendVerification = async () => {
    await api.post("/auth/verify-email/resend/");
  };

  const resetPassword = async (email: string) => {
    await api.post("/auth/password-reset/", { email });
  };

  return {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    fetchUser,
    resendVerification,
    resetPassword,
  };
}
