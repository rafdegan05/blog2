"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialProviders from "@/components/SocialProviders";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [availableProviderIds, setAvailableProviderIds] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((ids: string[]) => setAvailableProviderIds(ids))
      .catch(() => setAvailableProviderIds([]));
  }, []);

  const handleCredentialSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl });
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card bg-base-200 w-full max-w-md shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">Sign In</h1>
          <p className="text-center text-base-content/60 mb-6">
            Sign in to create posts, podcasts, and engage with the community.
          </p>

          {error && (
            <div className="alert alert-error mb-4">
              <span>
                {error === "OAuthSignin" && "Error signing in with provider."}
                {error === "OAuthCallback" && "Error during authentication callback."}
                {error === "CredentialsSignin" &&
                  "Invalid credentials. Please check your email and password."}
                {error === "OAuthAccountNotLinked" &&
                  "This email is already associated with another provider."}
                {![
                  "OAuthSignin",
                  "OAuthCallback",
                  "CredentialsSignin",
                  "OAuthAccountNotLinked",
                ].includes(error) && "An error occurred during sign in."}
              </span>
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
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="link link-primary">
              Register
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
