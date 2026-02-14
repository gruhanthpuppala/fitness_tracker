"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProfileForm from "@/components/forms/ProfileForm";
import TargetForm from "@/components/forms/TargetForm";
import type { UserTarget } from "@/types/user";
import { computeBmi, getBmiCategory } from "@/lib/utils";

export default function SettingsPage() {
  const { user, logout, fetchUser } = useAuth();
  const { showToast } = useToast();
  const [targets, setTargets] = useState<UserTarget | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get("/settings/");
        const data = res.data.data || res.data;
        setTargets(data.targets);
      } catch {
        // Ignore
      }
    };
    loadSettings();
  }, []);

  const handleProfileUpdate = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api.put("/settings/", { profile: data });
      await fetchUser();
      showToast("Profile updated!");
    } catch {
      showToast("Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTargetUpdate = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api.put("/settings/", { targets: data });
      const res = await api.get("/settings/");
      setTargets((res.data.data || res.data).targets);
      showToast("Targets updated!");
    } catch {
      showToast("Failed to update targets.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.put("/auth/password-change/", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      showToast("Password changed!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(", ")
        : "Failed to change password.";
      setPasswordError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await api.delete("/users/me/");
      showToast("Account deactivated.");
      logout();
    } catch {
      showToast("Failed to deactivate account.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const bmi = user.height_cm && user.age
    ? computeBmi(0, Number(user.height_cm))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      {/* Profile */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Information</h2>
        <ProfileForm user={user} onSubmit={handleProfileUpdate} loading={loading} />
      </Card>

      {/* Targets */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Targets</h2>
        <TargetForm targets={targets} onSubmit={handleTargetUpdate} loading={loading} />
      </Card>

      {/* Change Password */}
      {user.auth_provider === "email" && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="bg-status-error/10 text-status-error text-sm rounded-input px-3 py-2">
                {passwordError}
              </div>
            )}
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={loading}>
              Change Password
            </Button>
          </form>
        </Card>
      )}

      {/* About */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">About</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Auth Provider</span>
            <span className="capitalize">{user.auth_provider}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Member Since</span>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-status-error/30">
        <h2 className="text-lg font-semibold text-status-error mb-4">Danger Zone</h2>
        {!showDeactivate ? (
          <Button variant="danger" onClick={() => setShowDeactivate(true)}>
            Deactivate Account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              This will deactivate your account. Your data will be retained but you will not be able to log in.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeactivate(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeactivate} loading={loading}>
                Confirm Deactivation
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Logout */}
      <Button variant="secondary" className="w-full" onClick={logout}>
        Logout
      </Button>
    </motion.div>
  );
}
