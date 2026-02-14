"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { passwordResetSchema } from "@/lib/validators";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = passwordResetSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">&#9993;</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Check Your Email</h1>
              <p className="text-text-secondary mb-6">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
              <Link href="/login" className="text-accent-primary hover:text-accent-primary-hover text-sm">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Reset Password</h1>
              <p className="text-text-secondary mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  autoFocus
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-text-secondary mt-6">
                <Link href="/login" className="text-accent-primary hover:text-accent-primary-hover">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
