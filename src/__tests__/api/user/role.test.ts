import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { GET, PUT } from "@/app/api/user/role/route";

const BASE = "http://localhost/api/user/role";

describe("GET /api/user/role", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockSession({ role: "AUTHOR" });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns users list for ADMIN", async () => {
    mockSession({ role: "ADMIN" });
    const users = [
      { id: "u1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
      { id: "u2", name: "User", email: "user@test.com", role: "USER" },
    ];
    prismaMock.user.findMany.mockResolvedValue(users);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

describe("PUT /api/user/role", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { userId: "u1", role: "AUTHOR" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockSession({ role: "AUTHOR" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { userId: "u1", role: "AUTHOR" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 400 when userId or role missing", async () => {
    mockSession({ role: "ADMIN" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { userId: "u1" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid role value", async () => {
    mockSession({ role: "ADMIN" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { userId: "u1", role: "SUPERADMIN" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(400);
  });

  it("prevents admin from revoking own admin role", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { userId: "admin-1", role: "USER" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("own admin");
  });

  it("returns 404 when user not found", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { userId: "nonexistent", role: "AUTHOR" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(404);
  });

  it("updates user role successfully", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u2",
      role: "USER",
    });
    prismaMock.user.update.mockResolvedValue({
      id: "u2",
      name: "User",
      email: "user@test.com",
      role: "AUTHOR",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { userId: "u2", role: "AUTHOR" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe("AUTHOR");
  });
});
