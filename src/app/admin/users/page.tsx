"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  _count: { posts: number; podcasts: number; comments: number };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") return;

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/user/role");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session, status]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update role");
        return;
      }

      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      setSuccess(`Role updated for ${updated.name || updated.email}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("An error occurred");
    } finally {
      setUpdating(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-base-content/70 mb-4">You need admin privileges to access this page.</p>
        <Link href="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const roleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "badge-error";
      case "AUTHOR":
        return "badge-info";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="btn btn-ghost btn-sm">
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
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-base-content/60">{users.length} total users</p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
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

      {/* Search */}
      <div className="form-control mb-6">
        <input
          type="text"
          className="input input-bordered w-full max-w-md"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th className="hidden md:table-cell">Content</th>
              <th className="hidden lg:table-cell">Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="w-10 h-10 rounded-full bg-base-300">
                        {user.image ? (
                          <img src={user.image} alt={user.name || ""} className="rounded-full" />
                        ) : (
                          <span className="text-lg">
                            {(user.name || user.email || "?")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm">{user.name || "No name"}</div>
                      <div className="text-xs text-base-content/60">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${roleColor(user.role)} badge-sm`}>{user.role}</span>
                </td>
                <td className="hidden md:table-cell">
                  <div className="flex gap-2 text-xs">
                    <span className="badge badge-outline badge-sm">{user._count.posts} posts</span>
                    <span className="badge badge-outline badge-sm">
                      {user._count.podcasts} podcasts
                    </span>
                  </div>
                </td>
                <td className="hidden lg:table-cell text-sm text-base-content/60">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td>
                  {user.id === session.user?.id ? (
                    <span className="text-xs text-base-content/40">You</span>
                  ) : (
                    <select
                      className="select select-bordered select-sm w-28"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updating === user.id}
                    >
                      <option value="USER">USER</option>
                      <option value="AUTHOR">AUTHOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  )}
                  {updating === user.id && (
                    <span className="loading loading-spinner loading-xs ml-2" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-base-content/50">
          <p>No users found matching your search.</p>
        </div>
      )}
    </div>
  );
}
