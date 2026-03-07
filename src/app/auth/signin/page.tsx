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
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((ids: string[]) => setAvailableProviderIds(ids))
      .catch(() => setAvailableProviderIds([]));
  }, []);

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      OAuthSignin:
        "Could not start the sign-in process with the selected provider. Please try again.",
      OAuthCallback: "An error occurred during the authentication callback. Please try again.",
      OAuthCreateAccount: "Could not create an account with the selected provider.",
      EmailCreateAccount: "Could not create an account with the provided email.",
      Callback: "An error occurred during the authentication process.",
      OAuthAccountNotLinked:
        "This email is already associated with another sign-in method. Please use the original method.",
      CredentialsSignin: "Invalid email or password. Please check your credentials and try again.",
      SessionRequired: "You need to be signed in to access this page.",
      Default: "An unexpected error occurred during sign in. Please try again.",
    };
    return errorMessages[errorCode] || errorMessages.Default;
  };

  const handleCredentialSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    if (!email) {
      setFormError("Please enter your email address.");
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
        setFormError("Invalid email or password. Please check your credentials and try again.");
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card bg-base-200 w-full max-w-md shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">Sign In</h1>
          <p className="text-center text-base-content/60 mb-6">
            Sign in to create posts, podcasts, and engage with the community.
          </p>

          {(error || formError) && (
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
              <span>{formError || (error ? getErrorMessage(error) : "")}</span>
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
              <label className="label">
                <Link href="/auth/reset-password" className="label-text-alt link link-primary">
                  Forgot password?
                </Link>
              </label>
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
