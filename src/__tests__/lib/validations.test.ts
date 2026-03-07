import { describe, it, expect } from "vitest";
import {
  registerSchema,
  registerServerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  profileUpdateSchema,
  formatZodErrors,
  formatZodFieldErrors,
} from "@/lib/validations";

describe("validations", () => {
  // ─── registerSchema ───
  describe("registerSchema", () => {
    it("passes with valid data", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      });
      expect(result.success).toBe(true);
    });

    it("fails with mismatched passwords", () => {
      const result = registerSchema.safeParse({
        name: "John",
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Different1",
      });
      expect(result.success).toBe(false);
    });

    it("fails with invalid email", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "Password1",
        confirmPassword: "Password1",
      });
      expect(result.success).toBe(false);
    });

    it("fails with short password", () => {
      const result = registerSchema.safeParse({
        email: "john@example.com",
        password: "Pas1",
        confirmPassword: "Pas1",
      });
      expect(result.success).toBe(false);
    });

    it("fails without uppercase in password", () => {
      const result = registerSchema.safeParse({
        email: "john@example.com",
        password: "password1",
        confirmPassword: "password1",
      });
      expect(result.success).toBe(false);
    });

    it("fails without lowercase in password", () => {
      const result = registerSchema.safeParse({
        email: "john@example.com",
        password: "PASSWORD1",
        confirmPassword: "PASSWORD1",
      });
      expect(result.success).toBe(false);
    });

    it("fails without number in password", () => {
      const result = registerSchema.safeParse({
        email: "john@example.com",
        password: "Password",
        confirmPassword: "Password",
      });
      expect(result.success).toBe(false);
    });

    it("allows name to be omitted", () => {
      const result = registerSchema.safeParse({
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── registerServerSchema ───
  describe("registerServerSchema", () => {
    it("passes with valid data (no confirmPassword)", () => {
      const result = registerServerSchema.safeParse({
        email: "john@example.com",
        password: "Password1",
      });
      expect(result.success).toBe(true);
    });

    it("passes with name included", () => {
      const result = registerServerSchema.safeParse({
        name: "John",
        email: "john@example.com",
        password: "Password1",
      });
      expect(result.success).toBe(true);
    });

    it("fails with invalid name characters", () => {
      const result = registerServerSchema.safeParse({
        name: "John123",
        email: "john@example.com",
        password: "Password1",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── loginSchema ───
  describe("loginSchema", () => {
    it("passes with valid data", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("fails with empty password", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("fails with invalid email", () => {
      const result = loginSchema.safeParse({
        email: "bad",
        password: "password",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── resetPasswordRequestSchema ───
  describe("resetPasswordRequestSchema", () => {
    it("passes with valid email", () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("fails with invalid email", () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── resetPasswordConfirmSchema ───
  describe("resetPasswordConfirmSchema", () => {
    it("passes with valid data", () => {
      const result = resetPasswordConfirmSchema.safeParse({
        token: "abc123",
        password: "NewPass1x",
        confirmPassword: "NewPass1x",
      });
      expect(result.success).toBe(true);
    });

    it("fails when passwords do not match", () => {
      const result = resetPasswordConfirmSchema.safeParse({
        token: "abc123",
        password: "NewPass1x",
        confirmPassword: "Different2",
      });
      expect(result.success).toBe(false);
    });

    it("fails with empty token", () => {
      const result = resetPasswordConfirmSchema.safeParse({
        token: "",
        password: "NewPass1x",
        confirmPassword: "NewPass1x",
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── profileUpdateSchema ───
  describe("profileUpdateSchema", () => {
    it("passes with partial update", () => {
      const result = profileUpdateSchema.safeParse({
        name: "Jane",
      });
      expect(result.success).toBe(true);
    });

    it("passes with bio update", () => {
      const result = profileUpdateSchema.safeParse({
        bio: "Hello world",
      });
      expect(result.success).toBe(true);
    });

    it("fails with too-long bio", () => {
      const result = profileUpdateSchema.safeParse({
        bio: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("passes with empty object", () => {
      const result = profileUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("allows image as empty string", () => {
      const result = profileUpdateSchema.safeParse({
        image: "",
      });
      expect(result.success).toBe(true);
    });

    it("allows valid image URL", () => {
      const result = profileUpdateSchema.safeParse({
        image: "https://example.com/avatar.png",
      });
      expect(result.success).toBe(true);
    });

    it("accepts notification booleans", () => {
      const result = profileUpdateSchema.safeParse({
        notifyComments: true,
        notifyNewPosts: false,
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── formatZodErrors ───
  describe("formatZodErrors", () => {
    it("formats multiple errors into a single string", () => {
      const result = registerServerSchema.safeParse({
        email: "bad",
        password: "x",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = formatZodErrors(result.error);
        expect(typeof msg).toBe("string");
        expect(msg.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── formatZodFieldErrors ───
  describe("formatZodFieldErrors", () => {
    it("returns field-level error map", () => {
      const result = registerServerSchema.safeParse({
        email: "bad",
        password: "x",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errs = formatZodFieldErrors(result.error);
        expect(typeof errs).toBe("object");
        expect(Object.keys(errs).length).toBeGreaterThan(0);
      }
    });
  });
});
