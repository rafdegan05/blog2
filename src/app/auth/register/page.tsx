"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialProviders from "@/components/SocialProviders";
import { registerSchema, formatZodFieldErrors } from "@/lib/validations";

function RegisterForm() {
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
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred.");
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
            <h1 className="card-title text-2xl justify-center mb-2">Check Your Email</h1>
            <p className="text-base-content/60 mb-4">
              We&apos;ve sent a verification link to <strong>{email}</strong>. Please check your
              inbox and click the link to verify your account.
            </p>
            <p className="text-base-content/40 text-sm mb-4">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <Link href="/auth/verify-email" className="link link-primary">
                request a new verification link
              </Link>
              .
            </p>
            <Link href="/auth/signin" className="btn btn-outline btn-primary">
              Go to Sign In
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
          <h1 className="card-title text-2xl justify-center mb-2">Create Account</h1>
          <p className="text-center text-base-content/60 mb-6">
            Join the community to create posts, podcasts, and more.
          </p>

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
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${fieldErrors.name ? "input-error" : ""}`}
                placeholder="Your name"
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
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className={`input input-bordered w-full ${fieldErrors.email ? "input-error" : ""}`}
                placeholder="your@email.com"
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
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${fieldErrors.password ? "input-error" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.password}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  Min 8 chars, with uppercase, lowercase and number
                </span>
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                placeholder="••••••••"
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
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link href="/auth/signin" className="link link-primary">
              Sign In
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
