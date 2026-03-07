"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialProviders from "@/components/SocialProviders";

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
    setLoading(true);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Auto sign-in after registration
      await signIn("credentials", { email, password, callbackUrl });
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
            <h1 className="card-title text-2xl justify-center mb-2">Account Created!</h1>
            <p className="text-base-content/60 mb-4">
              Your account has been created successfully. Redirecting...
            </p>
            <span className="loading loading-spinner loading-lg mx-auto" />
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
                className="input input-bordered w-full"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
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
