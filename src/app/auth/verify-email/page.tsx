"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/components/LanguageProvider";

function VerifyEmailContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An unexpected error occurred");
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setResendMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendMessage(data.message || t.auth.verificationSent);
    } catch {
      setResendMessage(t.auth.resendError);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card bg-base-200 w-full max-w-md shadow-xl">
        <div className="card-body text-center">
          {status === "loading" && (
            <>
              <h1 className="card-title text-2xl justify-center mb-2">{t.auth.verifyingEmail}</h1>
              <span className="loading loading-spinner loading-lg mx-auto" />
              <p className="text-base-content/60 mt-2">{t.auth.verifyingEmailText}</p>
            </>
          )}

          {status === "success" && (
            <>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="card-title text-2xl justify-center mb-2">{t.auth.emailVerified}</h1>
              <p className="text-base-content/60 mb-4">{message}</p>
              <Link href="/auth/signin" className="btn btn-primary">
                {t.common.signIn}
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-error text-5xl mb-4">
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
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="card-title text-2xl justify-center mb-2">
                {t.auth.verificationFailed}
              </h1>
              <p className="text-base-content/60 mb-4">{message}</p>

              {/* Resend form */}
              <div className="divider">{t.auth.resendVerificationDivider}</div>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder={t.auth.emailPlaceholder}
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-outline btn-primary w-full"
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    t.auth.resendVerification
                  )}
                </button>
              </form>
              {resendMessage && <p className="text-sm text-info mt-2">{resendMessage}</p>}

              <Link href="/auth/signin" className="link link-primary text-sm mt-4">
                {t.auth.backToSignIn}
              </Link>
            </>
          )}

          {status === "no-token" && (
            <>
              <h1 className="card-title text-2xl justify-center mb-2">{t.auth.verifyYourEmail}</h1>
              <p className="text-base-content/60 mb-4">{t.auth.verifyYourEmailText}</p>

              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder={t.auth.emailPlaceholder}
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary w-full" disabled={resendLoading}>
                  {resendLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    t.auth.sendVerificationEmail
                  )}
                </button>
              </form>
              {resendMessage && <p className="text-sm text-info mt-2">{resendMessage}</p>}

              <Link href="/auth/signin" className="link link-primary text-sm mt-4">
                {t.auth.backToSignIn}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
