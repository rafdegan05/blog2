import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, buildRequest, resetAllMocks } from "@/__tests__/helpers/api-helpers";

// Must mock before importing the route
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
    compare: vi.fn(),
  },
}));

vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue({
      toString: () => "mock-verification-token-hex",
    }),
  },
}));

import { POST } from "@/app/api/auth/register/route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("returns 400 for invalid input (missing email)", async () => {
    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { password: "Password1" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 for invalid email format", async () => {
    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { email: "not-an-email", password: "Password1" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for weak password", async () => {
    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { email: "john@example.com", password: "weak" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when user already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "existing-user",
      email: "john@example.com",
    });

    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { email: "john@example.com", password: "Password1" },
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already exists");
  });

  it("returns 201 on successful registration", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "new-user-1",
      email: "john@example.com",
      name: "john",
    });
    prismaMock.emailVerificationToken.create.mockResolvedValue({
      id: "token-1",
      token: "mock-verification-token-hex",
    });

    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: {
        email: "john@example.com",
        password: "Password1",
        name: "John",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.requiresVerification).toBe(true);
    expect(data.message).toContain("verify");
  });

  it("creates user with hashed password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "new-user-1",
      email: "john@example.com",
    });
    prismaMock.emailVerificationToken.create.mockResolvedValue({ id: "t1" });

    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { email: "john@example.com", password: "Password1" },
    });

    await POST(req);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "john@example.com",
        password: "$2a$12$hashedpassword",
        emailVerified: null,
      }),
    });
  });

  it("generates email verification token", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "user-1" });
    prismaMock.emailVerificationToken.create.mockResolvedValue({ id: "t1" });

    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { email: "john@example.com", password: "Password1" },
    });

    await POST(req);

    expect(prismaMock.emailVerificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        token: "mock-verification-token-hex",
        userId: "user-1",
      }),
    });
  });

  it("uses email prefix as name when name not provided", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "u1" });
    prismaMock.emailVerificationToken.create.mockResolvedValue({ id: "t1" });

    const req = buildRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: { email: "testuser@example.com", password: "Password1" },
    });

    await POST(req);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "testuser",
      }),
    });
  });
});
