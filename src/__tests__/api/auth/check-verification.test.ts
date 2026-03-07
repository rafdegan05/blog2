import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, buildRequest, resetAllMocks } from "@/__tests__/helpers/api-helpers";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { POST } from "@/app/api/auth/check-verification/route";

const bcryptCompare = vi.mocked(bcrypt.compare);

describe("POST /api/auth/check-verification", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("returns needsVerification: false when email/password missing", async () => {
    const req = buildRequest("http://localhost/api/auth/check-verification", {
      method: "POST",
      body: {},
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.needsVerification).toBe(false);
  });

  it("returns needsVerification: false when user not found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = buildRequest("http://localhost/api/auth/check-verification", {
      method: "POST",
      body: { email: "nobody@example.com", password: "Password1" },
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.needsVerification).toBe(false);
  });

  it("returns needsVerification: false when password is wrong", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      password: "$2a$12$hashed",
      emailVerified: null,
    });
    bcryptCompare.mockResolvedValue(false);

    const req = buildRequest("http://localhost/api/auth/check-verification", {
      method: "POST",
      body: { email: "user@example.com", password: "WrongPass1" },
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.needsVerification).toBe(false);
  });

  it("returns needsVerification: true when password correct but not verified", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      password: "$2a$12$hashed",
      emailVerified: null,
    });
    bcryptCompare.mockResolvedValue(true);

    const req = buildRequest("http://localhost/api/auth/check-verification", {
      method: "POST",
      body: { email: "user@example.com", password: "Password1" },
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.needsVerification).toBe(true);
  });

  it("returns needsVerification: false when password correct and verified", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      password: "$2a$12$hashed",
      emailVerified: new Date(),
    });
    bcryptCompare.mockResolvedValue(true);

    const req = buildRequest("http://localhost/api/auth/check-verification", {
      method: "POST",
      body: { email: "user@example.com", password: "Password1" },
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.needsVerification).toBe(false);
  });
});
