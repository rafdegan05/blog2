"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bannerImage: string | null;
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

type SettingsTab = "profile" | "notifications" | "security";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyNewPosts, setNotifyNewPosts] = useState(true);

  // Upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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
        setBannerUrl(data.bannerImage || "");
        setNotifyComments(data.notifyComments);
        setNotifyNewPosts(data.notifyNewPosts);
      }
    } catch {
      setError(t.profile.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.profile.loadFailed]);

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
      bannerImage: bannerUrl || null,
      notifyComments,
      notifyNewPosts,
    };

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

  const handleUpload = async (file: File, field: "avatar" | "banner") => {
    const setUploading = field === "avatar" ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", field);

      const res = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.profile.uploadFailed);
        return;
      }

      const { url } = await res.json();

      if (field === "avatar") {
        setImageUrl(url);
      } else {
        setBannerUrl(url);
      }

      // Auto-save to profile
      const saveRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          image: field === "avatar" ? url : imageUrl || null,
          bannerImage: field === "banner" ? url : bannerUrl || null,
          notifyComments,
          notifyNewPosts,
        }),
      });

      if (saveRes.ok) {
        setSuccess(t.profile.updateSuccess);
        fetchProfile();
      } else {
        const saveData = await saveRes.json();
        setError(saveData.error || t.profile.updateFailed);
      }
    } catch {
      setError(t.profile.uploadFailed);
    } finally {
      setUploading(false);
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

  const handle = profile?.name?.toLowerCase().replace(/\s+/g, "_") || profile?.id || "user";
  const memberDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="of-profile-wrapper">
      {/* ═══ Hero Banner ═══ */}
      <div
        className="of-banner"
        style={{ cursor: "pointer" }}
        onClick={() => bannerInputRef.current?.click()}
      >
        {bannerUrl ? (
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
        ) : (
          <div className="of-banner-gradient" />
        )}
        <div className="of-banner-overlay">
          {uploadingBanner ? (
            <span className="loading loading-spinner loading-md text-white" />
          ) : (
            <span className="of-banner-edit-hint">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t.profile.changeBanner}
            </span>
          )}
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, "banner");
            e.target.value = "";
          }}
        />
      </div>

      {/* ═══ Profile Header ═══ */}
      <div className="of-header">
        <div className="of-header-inner">
          {/* Avatar */}
          <div
            className="of-avatar-wrapper"
            style={{ cursor: "pointer" }}
            onClick={() => avatarInputRef.current?.click()}
          >
            <div
              className={`of-avatar ${!profile?.image && !imageUrl ? "of-avatar-placeholder" : ""}`}
            >
              {imageUrl || profile?.image ? (
                <Image
                  src={imageUrl || profile?.image || ""}
                  alt="Avatar"
                  width={130}
                  height={130}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <span className="text-4xl font-bold text-primary-content">
                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
              {uploadingAvatar && (
                <div className="of-avatar-uploading">
                  <span className="loading loading-spinner loading-sm text-white" />
                </div>
              )}
            </div>
            {/* Online indicator */}
            <div className="of-online-dot" />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, "avatar");
                e.target.value = "";
              }}
            />
          </div>

          {/* Name / Handle / Bio */}
          <div className="of-identity">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile?.name || "User"}</h1>
              {profile?.role && profile.role !== "USER" && (
                <span className="of-verified-badge">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>
            <p className="of-handle">@{handle}</p>
            {profile?.bio && <p className="of-bio">{profile.bio}</p>}
            <div className="of-meta-row">
              <span className="of-meta-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {t.profile.memberSince}
                {memberDate}
              </span>
              <span className="of-meta-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {profile?.email}
              </span>
            </div>
            {/* Public profile link */}
            {profile?.id && (
              <Link href={`/u/${profile.id}`} className="of-public-link">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                {t.profile.viewPublicProfile}
              </Link>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="of-stats-row">
          <div className="of-stat-item">
            <span className="of-stat-number">{profile?._count.posts || 0}</span>
            <span className="of-stat-label">{t.profile.posts}</span>
          </div>
          <div className="of-stat-divider" />
          <div className="of-stat-item">
            <span className="of-stat-number">{profile?._count.podcasts || 0}</span>
            <span className="of-stat-label">{t.profile.podcasts}</span>
          </div>
          <div className="of-stat-divider" />
          <div className="of-stat-item">
            <span className="of-stat-number">{profile?._count.comments || 0}</span>
            <span className="of-stat-label">{t.profile.comments}</span>
          </div>
          {profile?.accounts && profile.accounts.length > 0 && (
            <>
              <div className="of-stat-divider" />
              <div className="of-stat-item">
                <span className="of-stat-number">{profile.accounts.length}</span>
                <span className="of-stat-label">{t.profile.connectedAccounts}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ Alerts ═══ */}
      <div className="of-content">
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError("")}>
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4">
            <span>{success}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSuccess("")}>
              ✕
            </button>
          </div>
        )}

        {/* ═══ Tabs Navigation ═══ */}
        <div className="of-settings-tabs">
          <button
            className={`of-settings-tab ${activeTab === "profile" ? "of-settings-tab-active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {t.profile.tabProfile}
          </button>
          <button
            className={`of-settings-tab ${activeTab === "notifications" ? "of-settings-tab-active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {t.profile.tabNotifications}
          </button>
          <button
            className={`of-settings-tab ${activeTab === "security" ? "of-settings-tab-active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            {t.profile.tabSecurity}
          </button>
        </div>

        {/* ═══ Tab Content ═══ */}
        <form onSubmit={handleSaveProfile}>
          {/* ── Profile Tab ── */}
          {activeTab === "profile" && (
            <div className="of-settings-panel animate-fade-in">
              {/* Avatar upload */}
              <div className="of-field-group">
                <h3 className="of-section-title">{t.profile.imageLabel}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`of-avatar-preview ${!imageUrl ? "of-avatar-placeholder" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="Preview"
                        width={72}
                        height={72}
                        className="rounded-full object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xl font-bold text-primary-content">
                        {name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm gap-2"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      {uploadingAvatar ? t.profile.uploading : t.profile.uploadAvatar}
                    </button>
                    <p className="of-field-hint">{t.profile.imagePlaceholder}</p>
                  </div>
                </div>
              </div>

              {/* Banner upload */}
              <div className="of-field-group">
                <h3 className="of-section-title">{t.profile.bannerLabel}</h3>
                <div
                  className="of-banner-preview"
                  style={{ cursor: "pointer" }}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {bannerUrl ? (
                    <Image
                      src={bannerUrl}
                      alt="Banner preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="of-banner-preview-placeholder">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-base-content/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {uploadingBanner && (
                    <div className="of-banner-preview-loading">
                      <span className="loading loading-spinner loading-md text-white" />
                    </div>
                  )}
                  <div className="of-banner-preview-hint">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {uploadingBanner ? t.profile.uploading : t.profile.uploadBanner}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="of-field-group">
                <label className="of-field-label">{t.profile.nameLabel}</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder={t.profile.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="of-field-hint">
                  @{name?.toLowerCase().replace(/\s+/g, "_") || "username"}
                </p>
              </div>

              {/* Bio */}
              <div className="of-field-group">
                <label className="of-field-label">{t.profile.bioLabel}</label>
                <textarea
                  className="textarea textarea-bordered w-full h-28 resize-none"
                  placeholder={t.profile.bioPlaceholder}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                />
                <p className="of-field-hint of-field-hint-right">{bio.length}/500</p>
              </div>

              {/* Connected Accounts */}
              {profile?.accounts && profile.accounts.length > 0 && (
                <div className="of-field-group">
                  <h3 className="of-section-title">{t.profile.connectedAccounts}</h3>
                  <div className="of-connected-list">
                    {profile.accounts.map((account) => (
                      <div key={account.provider} className="of-connected-item">
                        <div className="of-provider-icon">
                          {account.provider === "google" && (
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          )}
                          {account.provider === "github" && (
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                          )}
                          {!["google", "github"].includes(account.provider) && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="capitalize font-medium text-sm">{account.provider}</span>
                        </div>
                        <span className="badge badge-success badge-sm gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {t.profile.connected}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="of-save-btn" disabled={saving}>
                {saving ? <span className="loading loading-spinner loading-sm" /> : t.common.save}
              </button>
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === "notifications" && (
            <div className="of-settings-panel animate-fade-in">
              <h3 className="of-section-title">{t.profile.notifications}</h3>

              <div className="of-toggle-group">
                <div className="of-toggle-item">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.profile.commentNotif}</p>
                    <p className="text-xs text-base-content/50">{t.profile.commentNotifDesc}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-lg"
                    checked={notifyComments}
                    onChange={(e) => setNotifyComments(e.target.checked)}
                  />
                </div>
                <div className="of-toggle-item">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.profile.postNotif}</p>
                    <p className="text-xs text-base-content/50">{t.profile.postNotifDesc}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-lg"
                    checked={notifyNewPosts}
                    onChange={(e) => setNotifyNewPosts(e.target.checked)}
                  />
                </div>
              </div>

              <button type="submit" className="of-save-btn" disabled={saving}>
                {saving ? <span className="loading loading-spinner loading-sm" /> : t.common.save}
              </button>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === "security" && (
            <div className="of-settings-panel animate-fade-in">
              {/* Password */}
              <div className="of-security-section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="of-section-title">{t.profile.passwordTitle}</h3>
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
                    <div className="of-field-group">
                      <label className="of-field-label">{t.profile.currentPassword}</label>
                      <input
                        type="password"
                        className="input input-bordered w-full"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="of-field-group">
                        <label className="of-field-label">{t.profile.newPassword}</label>
                        <input
                          type="password"
                          className="input input-bordered w-full"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={8}
                        />
                      </div>
                      <div className="of-field-group">
                        <label className="of-field-label">{t.profile.confirmNewPassword}</label>
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
                    <button type="submit" className="of-save-btn" disabled={saving}>
                      {saving ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        t.common.save
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Sessions */}
              <div className="of-security-section">
                <h3 className="of-section-title text-warning">{t.profile.sessionManagement}</h3>
                <p className="text-sm text-base-content/50 mb-4">{t.profile.sessionDesc}</p>
                <button
                  type="button"
                  className="btn btn-warning btn-outline w-full"
                  onClick={handleInvalidateSessions}
                >
                  {t.profile.signOutEverywhere}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="of-security-section of-danger-zone">
                <h3 className="of-section-title text-error">{t.profile.dangerZone}</h3>
                <p className="text-sm text-base-content/50 mb-4">{t.profile.dangerDesc}</p>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    className="btn btn-error btn-outline w-full"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {t.profile.deleteAccount}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-error">{t.profile.deleteConfirm}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-error flex-1"
                        onClick={handleDeleteAccount}
                      >
                        {t.profile.confirmDeleteBtn}
                      </button>
                      <button
                        type="button"
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
          )}
        </form>
      </div>
    </div>
  );
}
