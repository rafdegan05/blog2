import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { GET, PUT } from "@/app/api/admin/moderation/route";

const BASE = "http://localhost/api/admin/moderation";

describe("GET /api/admin/moderation", () => {
  beforeEach(() => resetAllMocks());

  it("returns 403 when not authenticated", async () => {
    mockNoSession();
    const req = new Request(BASE);
    const res = await GET(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 for USER role", async () => {
    mockSession({ role: "USER" });
    const req = new Request(BASE);
    const res = await GET(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 for AUTHOR role", async () => {
    mockSession({ role: "AUTHOR" });
    const req = new Request(BASE);
    const res = await GET(req as never);
    expect(res.status).toBe(403);
  });

  it("returns posts and podcasts for ADMIN", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.post.findMany.mockResolvedValue([{ id: "p1", title: "Post" }]);
    prismaMock.podcast.findMany.mockResolvedValue([{ id: "pc1", title: "Podcast" }]);

    const req = new Request(BASE);
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.posts).toHaveLength(1);
    expect(data.podcasts).toHaveLength(1);
  });

  it("filters by status param", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.podcast.findMany.mockResolvedValue([]);

    const req = new Request(`${BASE}?status=PENDING`);
    await GET(req as never);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { moderation: "PENDING" },
      })
    );
  });

  it("filters by type=posts", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.post.findMany.mockResolvedValue([]);

    const req = new Request(`${BASE}?type=posts`);
    await GET(req as never);

    expect(prismaMock.post.findMany).toHaveBeenCalled();
    expect(prismaMock.podcast.findMany).not.toHaveBeenCalled();
  });

  it("filters by type=podcasts", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.podcast.findMany.mockResolvedValue([]);

    const req = new Request(`${BASE}?type=podcasts`);
    await GET(req as never);

    expect(prismaMock.podcast.findMany).toHaveBeenCalled();
    expect(prismaMock.post.findMany).not.toHaveBeenCalled();
  });
});

describe("PUT /api/admin/moderation", () => {
  beforeEach(() => resetAllMocks());

  it("returns 403 when not admin", async () => {
    mockSession({ role: "AUTHOR" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "p1", type: "post", status: "APPROVED" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 400 when required fields missing", async () => {
    mockSession({ role: "ADMIN" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "p1" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status", async () => {
    mockSession({ role: "ADMIN" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "p1", type: "post", status: "INVALID" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(400);
  });

  it("updates post moderation status", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.post.update.mockResolvedValue({
      id: "p1",
      moderation: "APPROVED",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "p1", type: "post", status: "APPROVED" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(200);
    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({
        moderation: "APPROVED",
      }),
    });
  });

  it("updates podcast moderation status", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.podcast.update.mockResolvedValue({
      id: "pc1",
      moderation: "REJECTED",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "pc1", type: "podcast", status: "REJECTED" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(200);
  });

  it("auto-unpublishes flagged content", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.post.update.mockResolvedValue({ id: "p1" });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "p1", type: "post", status: "FLAGGED", flagReason: "Spam" },
    });

    await PUT(req as never);

    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({
        moderation: "FLAGGED",
        flagReason: "Spam",
        published: false,
      }),
    });
  });

  it("auto-unpublishes rejected content", async () => {
    mockSession({ role: "ADMIN" });
    prismaMock.post.update.mockResolvedValue({ id: "p1" });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "p1", type: "post", status: "REJECTED" },
    });

    await PUT(req as never);

    expect(prismaMock.post.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({
        published: false,
      }),
    });
  });

  it("returns 400 for invalid type", async () => {
    mockSession({ role: "ADMIN" });
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { id: "x1", type: "article", status: "APPROVED" },
    });

    const res = await PUT(req as never);
    expect(res.status).toBe(400);
  });
});
