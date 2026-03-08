"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialProviders from "@/components/SocialProviders";
import { loginSchema, formatZodFieldErrors } from "@/lib/validations";
import { useTranslation } from "@/components/LanguageProvider";

function SignInForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [availableProviderIds, setAvailableProviderIds] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((ids: string[]) => setAvailableProviderIds(ids))
      .catch(() => setAvailableProviderIds([]));
  }, []);

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      OAuthSignin: t.auth.errorOAuthSignin,
      OAuthCallback: t.auth.errorOAuthCallback,
      OAuthCreateAccount: t.auth.errorOAuthCreateAccount,
      EmailCreateAccount: t.auth.errorEmailCreateAccount,
      Callback: t.auth.errorCallback,
      OAuthAccountNotLinked: t.auth.errorOAuthAccountNotLinked,
      CredentialsSignin: t.auth.errorCredentialsSignin,
      SessionRequired: t.auth.errorSessionRequired,
      Default: t.auth.errorDefault,
    };
    return errorMessages[errorCode] || errorMessages.Default;
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMessage(data.message || t.auth.verificationSent);
    } catch {
      setResendMessage(t.auth.resendError);
    } finally {
      setResendLoading(false);
    }
  };

  const handleCredentialSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setShowResendVerification(false);
    setResendMessage("");
    setLoading(true);

    // Client-side Zod validation
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(formatZodFieldErrors(parsed.error));
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        // Check if the failure is due to unverified email
        try {
          const checkRes = await fetch("/api/auth/check-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const checkData = await checkRes.json();
          if (checkData.needsVerification) {
            setFormError(t.auth.errorEmailNotVerified);
            setShowResendVerification(true);
          } else {
            setFormError(t.auth.errorCredentialsSignin);
          }
        } catch {
          setFormError(t.auth.errorCredentialsSignin);
        }
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setFormError(t.auth.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card bg-base-200 w-full max-w-md shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">{t.auth.signInTitle}</h1>
          <p className="text-center text-base-content/60 mb-6">{t.auth.signInSubtitle}</p>

          {(error || formError) && (
            <div
              className={`alert ${showResendVerification ? "alert-warning" : "alert-error"} mb-4`}
            >
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
              <span>{formError || (error ? getErrorMessage(error) : "")}</span>
            </div>
          )}

          {showResendVerification && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <button
                onClick={handleResendVerification}
                className="btn btn-outline btn-sm btn-primary"
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  t.auth.resendVerification
                )}
              </button>
              {resendMessage && <p className="text-sm text-info">{resendMessage}</p>}
            </div>
          )}

          {/* OAuth Providers */}
          <SocialProviders
            callbackUrl={callbackUrl}
            mode="signin"
            availableProviderIds={availableProviderIds}
          />

          {/* Credential Sign In */}
          <form onSubmit={handleCredentialSignIn} className="space-y-4">
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
                <Link href="/auth/reset-password" className="label-text-alt link link-primary">
                  {t.auth.forgotPassword}
                </Link>
              </label>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : t.common.signIn}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            {t.auth.noAccount}
            <Link href="/auth/register" className="link link-primary">
              {t.auth.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
