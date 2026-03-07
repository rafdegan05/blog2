"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  role: string;
  notifyComments: boolean;
  notifyNewPosts: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    posts: number;
    podcasts: number;
    comments: number;
  };
  accounts: { provider: string; providerAccountId: string }[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyNewPosts, setNotifyNewPosts] = useState(true);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setImageUrl(data.image || "");
        setNotifyComments(data.notifyComments);
        setNotifyNewPosts(data.notifyNewPosts);
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchProfile();
  }, [session, fetchProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const body: Record<string, unknown> = {
      name,
      bio,
      image: imageUrl || null,
      notifyComments,
      notifyNewPosts,
    };

    // Include password change if form is shown and fields are filled
    if (showPasswordForm && newPassword) {
      if (newPassword !== confirmNewPassword) {
        setError("New passwords do not match");
        setSaving(false);
        return;
      }
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters");
        setSaving(false);
        return;
      }
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setSuccess("Profile updated successfully");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      fetchProfile();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleInvalidateSessions = async () => {
    try {
      const res = await fetch("/api/user/sessions", { method: "POST" });
      if (res.ok) {
        signOut({ callbackUrl: "/auth/signin" });
      }
    } catch {
      setError("Failed to invalidate sessions");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        setError("Failed to delete account");
      }
    } catch {
      setError("An unexpected error occurred");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Profile</h1>
        <p className="mb-4">Sign in to manage your profile.</p>
        <Link href="/auth/signin" className="btn btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-6">
          <span>{success}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSuccess("")}>
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column – Avatar & Stats */}
        <div className="space-y-6">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="avatar mb-4">
                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  {profile?.image ? (
                    <Image
                      src={profile.image}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-3xl font-bold rounded-full">
                      {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>
              <h2 className="card-title">{profile?.name || "User"}</h2>
              <p className="text-base-content/60">{profile?.email}</p>
              <div className="badge badge-primary">{profile?.role}</div>
              <p className="text-xs text-base-content/50 mt-2">
                Member since{" "}
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg">Activity</h3>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">Posts</div>
                  <div className="stat-value text-primary text-2xl">
                    {profile?._count.posts || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Podcasts</div>
                  <div className="stat-value text-secondary text-2xl">
                    {profile?._count.podcasts || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Comments</div>
                  <div className="stat-value text-accent text-2xl">
                    {profile?._count.comments || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          {profile?.accounts && profile.accounts.length > 0 && (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Connected Accounts</h3>
                <div className="space-y-2">
                  {profile.accounts.map((account) => (
                    <div key={account.provider} className="flex items-center gap-2">
                      <span className="badge badge-outline capitalize">{account.provider}</span>
                      <span className="text-xs text-base-content/50">Connected</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column – Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile}>
            {/* Basic Info */}
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Basic Information</h3>
                <div className="form-control mb-4">
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
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Bio</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-24"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Profile Image URL</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered w-full"
                    placeholder="https://example.com/avatar.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">Notification Preferences</h3>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notifyComments}
                      onChange={(e) => setNotifyComments(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-medium">Comment notifications</span>
                      <p className="text-xs text-base-content/50">
                        Get notified when someone comments on your posts
                      </p>
                    </div>
                  </label>
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notifyNewPosts}
                      onChange={(e) => setNotifyNewPosts(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-medium">New post notifications</span>
                      <p className="text-xs text-base-content/50">
                        Get notified about new blog posts and podcasts
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="card-title text-lg">Password</h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm ? "Cancel" : "Change Password"}
                  </button>
                </div>
                {showPasswordForm && (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Current Password</span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">New Password</span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Confirm New Password</span>
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full"
                        placeholder="••••••••"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        minLength={8}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : "Save Changes"}
            </button>
          </form>

          {/* Session Management */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg text-warning mb-2">Session Management</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Sign out from all devices. This will invalidate all active sessions and require you
                to sign in again on every device.
              </p>
              <button
                className="btn btn-warning btn-outline w-full"
                onClick={handleInvalidateSessions}
              >
                Sign Out Everywhere
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card bg-base-200 shadow-xl border border-error/30">
            <div className="card-body">
              <h3 className="card-title text-lg text-error mb-2">Danger Zone</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Once you delete your account, there is no going back. All of your posts, podcasts,
                and comments will be permanently deleted.
              </p>
              {!showDeleteConfirm ? (
                <button
                  className="btn btn-error btn-outline w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-error">
                    Are you sure? This action cannot be undone!
                  </p>
                  <div className="flex gap-2">
                    <button className="btn btn-error flex-1" onClick={handleDeleteAccount}>
                      Yes, Delete My Account
                    </button>
                    <button
                      className="btn btn-ghost flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
