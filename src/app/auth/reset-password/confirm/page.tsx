"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

function ConfirmResetForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t.auth.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordsNoMatch);
      return;
    }

    if (!token) {
      setError(t.auth.invalidResetToken);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.auth.somethingWentWrong);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t.common.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card bg-base-200 w-full max-w-md shadow-xl">
          <div className="card-body text-center">
            <h1 className="card-title text-2xl justify-center mb-2">
              {t.auth.passwordResetSuccess}
            </h1>
            <p className="text-base-content/60 mb-4">{t.auth.passwordResetSuccessText}</p>
            <Link href="/auth/signin" className="btn btn-primary">
              {t.common.signIn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card bg-base-200 w-full max-w-md shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">{t.auth.setNewPassword}</h1>
          <p className="text-center text-base-content/60 mb-6">{t.auth.setNewPasswordSubtitle}</p>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.auth.newPassword}</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.auth.confirmPassword}</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder={t.auth.passwordPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t.auth.resetPasswordBtn
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            <Link href="/auth/reset-password" className="link link-primary">
              {t.auth.requestNewResetLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <ConfirmResetForm />
    </Suspense>
  );
}
