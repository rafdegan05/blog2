"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
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
        setError(data.error || "Something went wrong");
        return;
      }

      setSent(true);
      // In dev mode the API returns the token for testing
      if (data.token) {
        setDevToken(data.token);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card bg-base-200 w-full max-w-md shadow-xl">
          <div className="card-body text-center">
            <h1 className="card-title text-2xl justify-center mb-2">Check Your Email</h1>
            <p className="text-base-content/60 mb-4">
              If an account with that email exists, we&apos;ve sent a password reset link. Please
              check your inbox and spam folder.
            </p>

            {devToken && (
              <div className="alert alert-info text-left text-sm mb-4">
                <div>
                  <p className="font-bold">Dev Mode – Reset Link:</p>
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
              Back to Sign In
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
          <h1 className="card-title text-2xl justify-center mb-2">Reset Password</h1>
          <p className="text-center text-base-content/60 mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Remember your password?{" "}
            <Link href="/auth/signin" className="link link-primary">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
