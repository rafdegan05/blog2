import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { GET, PUT, DELETE } from "@/app/api/posts/[slug]/route";

const BASE = "http://localhost/api/posts/test-post";

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("GET /api/posts/[slug]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 404 when post not found", async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    const req = new Request(BASE);
    const res = await GET(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(404);
  });

  it("returns post with author, categories, tags, comments", async () => {
    const post = {
      id: "p1",
      title: "Test Post",
      slug: "test-post",
      content: "Hello",
      author: { id: "a1", name: "Author", image: null, bio: null },
      categories: [{ name: "Tech", slug: "tech" }],
      tags: [{ name: "React", slug: "react" }],
      comments: [],
    };
    prismaMock.post.findUnique.mockResolvedValue(post);

    const req = new Request(BASE);
    const res = await GET(req as never, makeParams("test-post") as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe("Test Post");
    expect(data.author.name).toBe("Author");
  });
});

describe("PUT /api/posts/[slug]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Updated" },
    });

    const res = await PUT(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when post not found", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue(null);

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Updated" },
    });

    const res = await PUT(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not author and not admin", async () => {
    mockSession({ id: "user-2", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue({
      id: "p1",
      authorId: "user-1",
      slug: "test-post",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Updated" },
    });

    const res = await PUT(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(403);
  });

  it("allows author to update own post", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue({
      id: "p1",
      authorId: "user-1",
      slug: "test-post",
    });
    prismaMock.post.update.mockResolvedValue({
      id: "p1",
      title: "Updated Title",
      slug: "test-post",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Updated Title" },
    });

    const res = await PUT(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Updated Title");
  });

  it("allows ADMIN to update any post", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.post.findUnique.mockResolvedValue({
      id: "p1",
      authorId: "user-1",
      slug: "test-post",
    });
    prismaMock.post.update.mockResolvedValue({
      id: "p1",
      title: "Admin Updated",
    });

    const req = buildRequest(BASE, {
      method: "PUT",
      body: { title: "Admin Updated" },
    });

    const res = await PUT(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/posts/[slug]", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = new Request(BASE, { method: "DELETE" });

    const res = await DELETE(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(401);
  });

  it("returns 404 when post not found", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue(null);

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not author and not admin", async () => {
    mockSession({ id: "user-2", role: "USER" });
    prismaMock.post.findUnique.mockResolvedValue({
      id: "p1",
      authorId: "user-1",
    });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(403);
  });

  it("allows author to delete own post", async () => {
    mockSession({ id: "user-1", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue({
      id: "p1",
      authorId: "user-1",
    });
    prismaMock.post.delete.mockResolvedValue({ id: "p1" });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("deleted");
  });

  it("allows ADMIN to delete any post", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.post.findUnique.mockResolvedValue({
      id: "p1",
      authorId: "user-1",
    });
    prismaMock.post.delete.mockResolvedValue({ id: "p1" });

    const req = new Request(BASE, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("test-post") as never);
    expect(res.status).toBe(200);
  });
});
