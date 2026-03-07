import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { PUT, DELETE } from "@/app/api/comments/[id]/route";

const BASE = "http://localhost/api/comments/comment-1";

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PUT /api/comments/[id]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { content: "Updated" },
    });

    const res = await PUT(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when comment not found", async () => {
    mockSession({ id: "user-1" });
    prismaMock.comment.findUnique.mockResolvedValue(null);

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { content: "Updated" },
    });

    const res = await PUT(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not author and not admin", async () => {
    mockSession({ id: "user-2", role: "USER" });
    prismaMock.comment.findUnique.mockResolvedValue({
      id: "comment-1",
      authorId: "user-1",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { content: "Updated" },
    });

    const res = await PUT(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(403);
  });

  it("allows comment author to edit", async () => {
    mockSession({ id: "user-1", role: "USER" });
    prismaMock.comment.findUnique.mockResolvedValue({
      id: "comment-1",
      authorId: "user-1",
    });
    prismaMock.comment.update.mockResolvedValue({
      id: "comment-1",
      content: "Updated content",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { content: "Updated content" },
    });

    const res = await PUT(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.content).toBe("Updated content");
  });

  it("allows ADMIN to edit any comment", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.comment.findUnique.mockResolvedValue({
      id: "comment-1",
      authorId: "user-1",
    });
    prismaMock.comment.update.mockResolvedValue({
      id: "comment-1",
      content: "Admin edited",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { content: "Admin edited" },
    });

    const res = await PUT(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/comments/[id]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = new Request(BASE, { method: "DELETE" });

    const res = await DELETE(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when comment not found", async () => {
    mockSession({ id: "user-1" });
    prismaMock.comment.findUnique.mockResolvedValue(null);

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(404);
  });

  it("returns 403 when not owner and not admin", async () => {
    mockSession({ id: "user-2", role: "USER" });
    prismaMock.comment.findUnique.mockResolvedValue({
      id: "comment-1",
      authorId: "user-1",
    });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(403);
  });

  it("allows author to delete own comment", async () => {
    mockSession({ id: "user-1", role: "USER" });
    prismaMock.comment.findUnique.mockResolvedValue({
      id: "comment-1",
      authorId: "user-1",
    });
    prismaMock.comment.delete.mockResolvedValue({ id: "comment-1" });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("deleted");
  });

  it("allows ADMIN to delete any comment", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.comment.findUnique.mockResolvedValue({
      id: "comment-1",
      authorId: "user-1",
    });
    prismaMock.comment.delete.mockResolvedValue({ id: "comment-1" });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("comment-1") as never);
    expect(res.status).toBe(200);
  });
});
