"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema } from "@/lib/validators";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user?.is_email_verified) {
        router.push("/verify-email");
      } else if (!user?.is_onboarded) {
        router.push("/setup");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: { detail?: string[] } } } };
      setApiError(
        error.response?.data?.errors?.detail?.[0] || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Google OAuth would open popup and return token
    // For now, placeholder for Google Sign-In integration
    setApiError("Google Sign-In requires client-side SDK setup.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Fitness Tracker</h1>
          <p className="text-text-secondary mt-2">Track. Trend. Transform.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm rounded-input px-3 py-2">
                {apiError}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoFocus
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-accent-primary hover:text-accent-primary-hover">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-sm text-text-muted">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Button variant="secondary" className="w-full" onClick={handleGoogleLogin}>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-text-secondary mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-accent-primary hover:text-accent-primary-hover">
              Sign up
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
