"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
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
      setResendMessage(data.message || "Verification email sent.");
    } catch {
      setResendMessage("An error occurred. Please try again.");
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
              <h1 className="card-title text-2xl justify-center mb-2">Verifying Email...</h1>
              <span className="loading loading-spinner loading-lg mx-auto" />
              <p className="text-base-content/60 mt-2">Please wait while we verify your email.</p>
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
              <h1 className="card-title text-2xl justify-center mb-2">Email Verified!</h1>
              <p className="text-base-content/60 mb-4">{message}</p>
              <Link href="/auth/signin" className="btn btn-primary">
                Sign In
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
              <h1 className="card-title text-2xl justify-center mb-2">Verification Failed</h1>
              <p className="text-base-content/60 mb-4">{message}</p>

              {/* Resend form */}
              <div className="divider">Resend verification</div>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="your@email.com"
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
                    "Resend Verification Email"
                  )}
                </button>
              </form>
              {resendMessage && <p className="text-sm text-info mt-2">{resendMessage}</p>}

              <Link href="/auth/signin" className="link link-primary text-sm mt-4">
                Back to Sign In
              </Link>
            </>
          )}

          {status === "no-token" && (
            <>
              <h1 className="card-title text-2xl justify-center mb-2">Verify Your Email</h1>
              <p className="text-base-content/60 mb-4">
                Enter your email below to receive a new verification link.
              </p>

              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary w-full" disabled={resendLoading}>
                  {resendLoading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Send Verification Email"
                  )}
                </button>
              </form>
              {resendMessage && <p className="text-sm text-info mt-2">{resendMessage}</p>}

              <Link href="/auth/signin" className="link link-primary text-sm mt-4">
                Back to Sign In
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
