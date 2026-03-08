"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";

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
  const { t } = useTranslation();
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
      setError(t.profile.loadFailed);
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
      if (!currentPassword) {
        setError(t.profile.currentPasswordRequired);
        setSaving(false);
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError(t.profile.newPasswordsNoMatch);
        setSaving(false);
        return;
      }
      if (newPassword.length < 8) {
        setError(t.profile.newPasswordMinLength);
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
        setError(data.error || t.profile.updateFailed);
        return;
      }

      setSuccess(t.profile.updateSuccess);
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      fetchProfile();
    } catch {
      setError(t.common.unexpectedError);
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
      setError(t.profile.sessionsFailed);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        setError(t.profile.deleteFailed);
      }
    } catch {
      setError(t.common.unexpectedError);
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
        <h1 className="text-3xl font-bold mb-4">{t.profile.title}</h1>
        <p className="mb-4">{t.profile.signInText}</p>
        <Link href="/auth/signin" className="btn btn-primary">
          {t.common.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t.profile.settingsTitle}</h1>

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
              <div className={`avatar mb-4 ${!profile?.image ? "placeholder" : ""}`}>
                <div
                  className={`w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 flex items-center justify-center ${!profile?.image ? "bg-primary text-primary-content" : ""}`}
                >
                  {profile?.image ? (
                    <Image
                      src={profile.image}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-3xl font-bold">
                      {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="card-title">{profile?.name || "User"}</h2>
              <p className="text-base-content/60">{profile?.email}</p>
              <div className="badge badge-primary">{profile?.role}</div>
              <p className="text-xs text-base-content/50 mt-2">
                {t.profile.memberSince}
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg">{t.profile.activity}</h3>
              <div className="stats stats-vertical shadow">
                <div className="stat">
                  <div className="stat-title">{t.profile.posts}</div>
                  <div className="stat-value text-primary text-2xl">
                    {profile?._count.posts || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">{t.profile.podcasts}</div>
                  <div className="stat-value text-secondary text-2xl">
                    {profile?._count.podcasts || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">{t.profile.comments}</div>
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
                <h3 className="card-title text-lg">{t.profile.connectedAccounts}</h3>
                <div className="space-y-2">
                  {profile.accounts.map((account) => (
                    <div key={account.provider} className="flex items-center gap-2">
                      <span className="badge badge-outline capitalize">{account.provider}</span>
                      <span className="text-xs text-base-content/50">{t.profile.connected}</span>
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
                <h3 className="card-title text-lg mb-4">{t.profile.basicInfo}</h3>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">{t.profile.nameLabel}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={t.profile.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">{t.profile.bioLabel}</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-24"
                    placeholder={t.profile.bioPlaceholder}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">{t.profile.imageLabel}</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered w-full"
                    placeholder={t.profile.imagePlaceholder}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">{t.profile.notifications}</h3>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notifyComments}
                      onChange={(e) => setNotifyComments(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-medium">{t.profile.commentNotif}</span>
                      <p className="text-xs text-base-content/50">{t.profile.commentNotifDesc}</p>
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
                      <span className="label-text font-medium">{t.profile.postNotif}</span>
                      <p className="text-xs text-base-content/50">{t.profile.postNotifDesc}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="card-title text-lg">{t.profile.passwordTitle}</h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm ? t.common.cancel : t.profile.changePassword}
                  </button>
                </div>
                {showPasswordForm && (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">{t.profile.currentPassword}</span>
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
                        <span className="label-text">{t.profile.newPassword}</span>
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
                        <span className="label-text">{t.profile.confirmNewPassword}</span>
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
              {saving ? <span className="loading loading-spinner loading-sm" /> : t.common.save}
            </button>
          </form>

          {/* Session Management */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-lg text-warning mb-2">
                {t.profile.sessionManagement}
              </h3>
              <p className="text-sm text-base-content/60 mb-4">{t.profile.sessionDesc}</p>
              <button
                className="btn btn-warning btn-outline w-full"
                onClick={handleInvalidateSessions}
              >
                {t.profile.signOutEverywhere}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card bg-base-200 shadow-xl border border-error/30">
            <div className="card-body">
              <h3 className="card-title text-lg text-error mb-2">{t.profile.dangerZone}</h3>
              <p className="text-sm text-base-content/60 mb-4">{t.profile.dangerDesc}</p>
              {!showDeleteConfirm ? (
                <button
                  className="btn btn-error btn-outline w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t.profile.deleteAccount}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-error">{t.profile.deleteConfirm}</p>
                  <div className="flex gap-2">
                    <button className="btn btn-error flex-1" onClick={handleDeleteAccount}>
                      {t.profile.confirmDeleteBtn}
                    </button>
                    <button
                      className="btn btn-ghost flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      {t.common.cancel}
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
