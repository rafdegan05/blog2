import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { GET, PUT, DELETE } from "@/app/api/podcasts/[slug]/route";

const BASE = "http://localhost/api/podcasts/test-ep";

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /api/podcasts/[slug]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 404 when podcast not found", async () => {
    prismaMock.podcast.findUnique.mockResolvedValue(null);

    const req = new Request(BASE);
    const res = await GET(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(404);
  });

  it("returns podcast data", async () => {
    prismaMock.podcast.findUnique.mockResolvedValue({
      id: "pc1",
      title: "Test Episode",
      slug: "test-ep",
      audioUrl: "https://example.com/audio.mp3",
      author: { id: "a1", name: "Host" },
      categories: [],
      tags: [],
    });

    const req = new Request(BASE);
    const res = await GET(req as never, makeParams("test-ep") as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe("Test Episode");
  });
});

describe("PUT /api/podcasts/[slug]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Updated" },
    });

    const res = await PUT(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when podcast not found", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue(null);

    const req = buildRequest(BASE, { method: "PUT", body: { title: "X" } });
    const res = await PUT(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not author and not admin", async () => {
    mockSession({ id: "user-2", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue({
      id: "pc1",
      authorId: "user-1",
    });

    const req = buildRequest(BASE, { method: "PUT", body: { title: "X" } });
    const res = await PUT(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(403);
  });

  it("allows author to update own podcast", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue({
      id: "pc1",
      authorId: "user-1",
    });
    prismaMock.podcast.update.mockResolvedValue({
      id: "pc1",
      title: "Updated Episode",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Updated Episode" },
    });

    const res = await PUT(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(200);
  });

  it("allows ADMIN to update any podcast", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.podcast.findUnique.mockResolvedValue({
      id: "pc1",
      authorId: "user-1",
    });
    prismaMock.podcast.update.mockResolvedValue({ id: "pc1" });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Admin Updated" },
    });

    const res = await PUT(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/podcasts/[slug]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when not found", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue(null);

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(404);
  });

  it("returns 403 when not owner and not admin", async () => {
    mockSession({ id: "user-2", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue({
      id: "pc1",
      authorId: "user-1",
    });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(403);
  });

  it("allows author to delete own podcast", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue({
      id: "pc1",
      authorId: "user-1",
    });
    prismaMock.podcast.delete.mockResolvedValue({ id: "pc1" });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("deleted");
  });

  it("allows ADMIN to delete any podcast", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.podcast.findUnique.mockResolvedValue({
      id: "pc1",
      authorId: "user-1",
    });
    prismaMock.podcast.delete.mockResolvedValue({ id: "pc1" });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-ep") as never);
    expect(res.status).toBe(200);
  });
});
