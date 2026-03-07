import { describe, it, expect } from "vitest";
import {
  hasRole,
  canCreateContent,
  canModifyResource,
  canManageUsers,
  canModerateComments,
  canPublishContent,
  getPermissions,
} from "@/lib/permissions";

describe("permissions", () => {
  // ─── hasRole ───
  describe("hasRole", () => {
    it("returns false when role is undefined", () => {
      expect(hasRole(undefined, "USER")).toBe(false);
    });

    it("USER satisfies USER minimum", () => {
      expect(hasRole("USER", "USER")).toBe(true);
    });

    it("AUTHOR satisfies USER minimum", () => {
      expect(hasRole("AUTHOR", "USER")).toBe(true);
    });

    it("ADMIN satisfies USER minimum", () => {
      expect(hasRole("ADMIN", "USER")).toBe(true);
    });

    it("USER does NOT satisfy AUTHOR minimum", () => {
      expect(hasRole("USER", "AUTHOR")).toBe(false);
    });

    it("AUTHOR satisfies AUTHOR minimum", () => {
      expect(hasRole("AUTHOR", "AUTHOR")).toBe(true);
    });

    it("ADMIN satisfies AUTHOR minimum", () => {
      expect(hasRole("ADMIN", "AUTHOR")).toBe(true);
    });

    it("USER does NOT satisfy ADMIN minimum", () => {
      expect(hasRole("USER", "ADMIN")).toBe(false);
    });

    it("AUTHOR does NOT satisfy ADMIN minimum", () => {
      expect(hasRole("AUTHOR", "ADMIN")).toBe(false);
    });

    it("ADMIN satisfies ADMIN minimum", () => {
      expect(hasRole("ADMIN", "ADMIN")).toBe(true);
    });
  });

  // ─── canCreateContent ───
  describe("canCreateContent", () => {
    it("returns false for undefined role", () => {
      expect(canCreateContent(undefined)).toBe(false);
    });

    it("returns false for USER", () => {
      expect(canCreateContent("USER")).toBe(false);
    });

    it("returns true for AUTHOR", () => {
      expect(canCreateContent("AUTHOR")).toBe(true);
    });

    it("returns true for ADMIN", () => {
      expect(canCreateContent("ADMIN")).toBe(true);
    });
  });

  // ─── canModifyResource ───
  describe("canModifyResource", () => {
    it("returns false when userId is undefined", () => {
      expect(canModifyResource("AUTHOR", "author-1", undefined)).toBe(false);
    });

    it("returns false when role is undefined", () => {
      expect(canModifyResource(undefined, "author-1", "user-1")).toBe(false);
    });

    it("returns true for ADMIN regardless of ownership", () => {
      expect(canModifyResource("ADMIN", "author-1", "user-99")).toBe(true);
    });

    it("returns true when user owns the resource", () => {
      expect(canModifyResource("AUTHOR", "user-1", "user-1")).toBe(true);
    });

    it("returns true when USER owns the resource", () => {
      expect(canModifyResource("USER", "user-1", "user-1")).toBe(true);
    });

    it("returns false when AUTHOR does not own the resource", () => {
      expect(canModifyResource("AUTHOR", "author-1", "user-2")).toBe(false);
    });

    it("returns false when USER does not own the resource", () => {
      expect(canModifyResource("USER", "author-1", "user-2")).toBe(false);
    });
  });

  // ─── canManageUsers ───
  describe("canManageUsers", () => {
    it("returns false for undefined", () => {
      expect(canManageUsers(undefined)).toBe(false);
    });

    it("returns false for USER", () => {
      expect(canManageUsers("USER")).toBe(false);
    });

    it("returns false for AUTHOR", () => {
      expect(canManageUsers("AUTHOR")).toBe(false);
    });

    it("returns true for ADMIN", () => {
      expect(canManageUsers("ADMIN")).toBe(true);
    });
  });

  // ─── canModerateComments ───
  describe("canModerateComments", () => {
    it("returns false for USER", () => {
      expect(canModerateComments("USER")).toBe(false);
    });

    it("returns false for AUTHOR", () => {
      expect(canModerateComments("AUTHOR")).toBe(false);
    });

    it("returns true for ADMIN", () => {
      expect(canModerateComments("ADMIN")).toBe(true);
    });
  });

  // ─── canPublishContent ───
  describe("canPublishContent", () => {
    it("returns false for USER", () => {
      expect(canPublishContent("USER")).toBe(false);
    });

    it("returns true for AUTHOR", () => {
      expect(canPublishContent("AUTHOR")).toBe(true);
    });

    it("returns true for ADMIN", () => {
      expect(canPublishContent("ADMIN")).toBe(true);
    });
  });

  // ─── getPermissions ───
  describe("getPermissions", () => {
    it("returns all false for undefined role", () => {
      const p = getPermissions(undefined);
      expect(p.canCreateContent).toBe(false);
      expect(p.canManageUsers).toBe(false);
      expect(p.canModerateComments).toBe(false);
      expect(p.canPublishContent).toBe(false);
      expect(p.isAdmin).toBe(false);
      expect(p.isAuthor).toBe(false);
    });

    it("returns correct permissions for USER", () => {
      const p = getPermissions("USER");
      expect(p.canCreateContent).toBe(false);
      expect(p.canManageUsers).toBe(false);
      expect(p.canModerateComments).toBe(false);
      expect(p.canPublishContent).toBe(false);
      expect(p.isAdmin).toBe(false);
      expect(p.isAuthor).toBe(false);
    });

    it("returns correct permissions for AUTHOR", () => {
      const p = getPermissions("AUTHOR");
      expect(p.canCreateContent).toBe(true);
      expect(p.canManageUsers).toBe(false);
      expect(p.canModerateComments).toBe(false);
      expect(p.canPublishContent).toBe(true);
      expect(p.isAdmin).toBe(false);
      expect(p.isAuthor).toBe(true);
    });

    it("returns correct permissions for ADMIN", () => {
      const p = getPermissions("ADMIN");
      expect(p.canCreateContent).toBe(true);
      expect(p.canManageUsers).toBe(true);
      expect(p.canModerateComments).toBe(true);
      expect(p.canPublishContent).toBe(true);
      expect(p.isAdmin).toBe(true);
      expect(p.isAuthor).toBe(true);
    });
  });
});
