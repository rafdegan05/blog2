"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialProviders from "@/components/SocialProviders";
import { registerSchema, formatZodFieldErrors } from "@/lib/validations";
import { useTranslation } from "@/components/LanguageProvider";

function RegisterForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [availableProviderIds, setAvailableProviderIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((ids: string[]) => setAvailableProviderIds(ids))
      .catch(() => setAvailableProviderIds([]));
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    // Client-side Zod validation
    const parsed = registerSchema.safeParse({
      name: name || undefined,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setFieldErrors(formatZodFieldErrors(parsed.error));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.auth.registrationFailed);
        setLoading(false);
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
            <div className="text-success text-5xl mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="card-title text-2xl justify-center mb-2">{t.auth.checkEmail}</h1>
            <p className="text-base-content/60 mb-4">
              {t.auth.checkEmailText.replace("{email}", email)}
            </p>
            <p className="text-base-content/40 text-sm mb-4">
              {t.auth.checkEmailSpam}
              <Link href="/auth/verify-email" className="link link-primary">
                {t.auth.requestNewLink}
              </Link>
              .
            </p>
            <Link href="/auth/signin" className="btn btn-outline btn-primary">
              {t.auth.goToSignIn}
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
          <h1 className="card-title text-2xl justify-center mb-2">{t.auth.createAccountTitle}</h1>
          <p className="text-center text-base-content/60 mb-6">{t.auth.createAccountSubtitle}</p>

          {error && (
            <div className="alert alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* OAuth Providers */}
          <SocialProviders
            callbackUrl={callbackUrl}
            mode="signup"
            availableProviderIds={availableProviderIds}
          />

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.auth.name}</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${fieldErrors.name ? "input-error" : ""}`}
                placeholder={t.auth.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {fieldErrors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.name}</span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.auth.email}</span>
              </label>
              <input
                type="email"
                className={`input input-bordered w-full ${fieldErrors.email ? "input-error" : ""}`}
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.email}</span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.auth.password}</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${fieldErrors.password ? "input-error" : ""}`}
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.password}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt text-base-content/50">{t.auth.passwordHint}</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.auth.confirmPassword}</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                placeholder={t.auth.passwordPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {fieldErrors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.confirmPassword}</span>
                </label>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                t.auth.createAccountBtn
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            {t.auth.hasAccount}
            <Link href="/auth/signin" className="link link-primary">
              {t.common.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
