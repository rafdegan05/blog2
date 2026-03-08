"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [devToken, setDevToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.auth.somethingWentWrong);
        return;
      }

      setSent(true);
      // In dev mode the API returns the token for testing
      if (data.token) {
        setDevToken(data.token);
      }
    } catch {
      setError(t.common.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card bg-base-200 w-full max-w-md shadow-xl">
          <div className="card-body text-center">
            <h1 className="card-title text-2xl justify-center mb-2">{t.auth.checkEmail}</h1>
            <p className="text-base-content/60 mb-4">{t.auth.checkEmailReset}</p>

            {devToken && (
              <div className="alert alert-info text-left text-sm mb-4">
                <div>
                  <p className="font-bold">{t.auth.devResetLink}</p>
                  <Link
                    href={`/auth/reset-password/confirm?token=${devToken}`}
                    className="link link-primary break-all"
                  >
                    /auth/reset-password/confirm?token={devToken.substring(0, 16)}...
                  </Link>
                </div>
              </div>
            )}

            <Link href="/auth/signin" className="btn btn-primary">
              {t.auth.backToSignIn}
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
          <h1 className="card-title text-2xl justify-center mb-2">{t.auth.resetPasswordTitle}</h1>
          <p className="text-center text-base-content/60 mb-6">{t.auth.resetPasswordSubtitle}</p>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.auth.email}</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t.auth.sendResetLink
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            {t.auth.rememberPassword}
            <Link href="/auth/signin" className="link link-primary">
              {t.common.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
