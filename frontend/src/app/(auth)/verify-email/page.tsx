"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { resendVerification } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification();
      setSent(true);
      setCooldown(60);
    } catch {
      // Handled silently
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
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">&#9993;</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Check Your Email</h1>
          <p className="text-text-secondary mb-6">
            We&apos;ve sent a verification link to your email address. Click the link to verify your
            account.
          </p>

          {sent && (
            <p className="text-status-success text-sm mb-4">Verification email sent!</p>
          )}

          <Button
            onClick={handleResend}
            disabled={cooldown > 0}
            loading={loading}
            variant="secondary"
            className="w-full"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Verification Email"}
          </Button>

          <p className="text-sm text-text-secondary mt-6">
            <Link href="/register" className="text-accent-primary hover:text-accent-primary-hover">
              Use a different email
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
