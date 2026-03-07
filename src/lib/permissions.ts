import { Role } from "@/generated/prisma/enums";

/**
 * Role hierarchy: ADMIN > AUTHOR > USER
 * ADMIN  – full access (manage users, all content, settings)
 * AUTHOR – create / edit / delete own posts & podcasts
 * USER   – read content, comment, manage own profile
 */

const ROLE_LEVEL: Record<Role, number> = {
  USER: 0,
  AUTHOR: 1,
  ADMIN: 2,
};

/** Check whether `role` is at least `minRole` in the hierarchy. */
export function hasRole(role: Role | undefined, minRole: Role): boolean {
  if (!role) return false;
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

/** Returns true if the user can create posts/podcasts. */
export function canCreateContent(role: Role | undefined): boolean {
  return hasRole(role, "AUTHOR");
}

/** Returns true if the user can edit/delete a resource they own, or is ADMIN. */
export function canModifyResource(
  role: Role | undefined,
  resourceAuthorId: string,
  userId: string | undefined
): boolean {
  if (!userId || !role) return false;
  if (role === "ADMIN") return true;
  return resourceAuthorId === userId;
}

/** Returns true if the user can manage other users (roles, bans, etc.). */
export function canManageUsers(role: Role | undefined): boolean {
  return hasRole(role, "ADMIN");
}

/** Returns true if the user can moderate comments (edit/delete any). */
export function canModerateComments(role: Role | undefined): boolean {
  return hasRole(role, "ADMIN");
}

/** Returns true if the user can publish content (make it visible). */
export function canPublishContent(role: Role | undefined): boolean {
  return hasRole(role, "AUTHOR");
}

/** Permission map for UI feature gating. */
export function getPermissions(role: Role | undefined) {
  return {
    canCreateContent: canCreateContent(role),
    canManageUsers: canManageUsers(role),
    canModerateComments: canModerateComments(role),
    canPublishContent: canPublishContent(role),
    isAdmin: hasRole(role, "ADMIN"),
    isAuthor: hasRole(role, "AUTHOR"),
  };
}
