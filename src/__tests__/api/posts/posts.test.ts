import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  authMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { GET, POST } from "@/app/api/posts/route";

const BASE = "http://localhost/api/posts";

describe("GET /api/posts", () => {
  beforeEach(() => resetAllMocks());

  it("returns paginated posts", async () => {
    const posts = [
      { id: "p1", title: "Post 1", slug: "post-1" },
      { id: "p2", title: "Post 2", slug: "post-2" },
    ];
    prismaMock.post.findMany.mockResolvedValue(posts);
    prismaMock.post.count.mockResolvedValue(2);

    const req = new Request(BASE);
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.posts).toHaveLength(2);
    expect(data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it("respects page and limit params", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.post.count.mockResolvedValue(25);

    const req = new Request(`${BASE}?page=3&limit=5`);
    const res = await GET(req as never);
    const data = await res.json();

    expect(data.pagination.page).toBe(3);
    expect(data.pagination.limit).toBe(5);
    expect(data.pagination.totalPages).toBe(5);
  });

  it("filters approved and published posts only", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.post.count.mockResolvedValue(0);

    const req = new Request(BASE);
    await GET(req as never);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          published: true,
          moderation: "APPROVED",
        }),
      })
    );
  });

  it("supports search parameter", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.post.count.mockResolvedValue(0);

    const req = new Request(`${BASE}?search=nextjs`);
    await GET(req as never);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: expect.objectContaining({ contains: "nextjs" }) }),
          ]),
        }),
      })
    );
  });

  it("supports category filter", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.post.count.mockResolvedValue(0);

    const req = new Request(`${BASE}?category=tech`);
    await GET(req as never);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categories: expect.objectContaining({
            some: { slug: "tech" },
          }),
        }),
      })
    );
  });
});

describe("POST /api/posts", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Test", content: "Content" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 for USER role", async () => {
    mockSession({ role: "USER" });
    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Test", content: "Content" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    mockSession({ role: "AUTHOR" });
    const req = buildRequest(BASE, {
      method: "POST",
      body: { content: "Content" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is missing", async () => {
    mockSession({ role: "AUTHOR" });
    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Test" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("creates post successfully for AUTHOR", async () => {
    mockSession({ id: "author-1", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue(null); // no slug collision
    prismaMock.post.create.mockResolvedValue({
      id: "post-1",
      title: "My Post",
      slug: "my-post",
      content: "Content here",
      authorId: "author-1",
    });

    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "My Post", content: "Content here" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("My Post");
  });

  it("creates post successfully for ADMIN", async () => {
    mockSession({ id: "admin-1", role: "ADMIN" });
    prismaMock.post.findUnique.mockResolvedValue(null);
    prismaMock.post.create.mockResolvedValue({
      id: "post-2",
      title: "Admin Post",
      slug: "admin-post",
    });

    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Admin Post", content: "Admin content" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(201);
  });

  it("generates unique slug on collision", async () => {
    mockSession({ id: "author-1", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue({ id: "existing" }); // slug collision
    prismaMock.post.create.mockResolvedValue({
      id: "post-3",
      slug: "my-post-1234567890",
    });

    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "My Post", content: "Content" },
    });

    await POST(req as never);

    expect(prismaMock.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: expect.stringMatching(/^my-post-\d+$/),
        }),
      })
    );
  });

  it("connects categories and tags", async () => {
    mockSession({ id: "author-1", role: "AUTHOR" });
    prismaMock.post.findUnique.mockResolvedValue(null);
    prismaMock.post.create.mockResolvedValue({ id: "post-4" });

    const req = buildRequest(BASE, {
      method: "POST",
      body: {
        title: "Tagged Post",
        content: "Content",
        categories: ["Tech", "Science"],
        tags: ["react", "nextjs"],
      },
    });

    await POST(req as never);

    expect(prismaMock.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categories: expect.objectContaining({
            connectOrCreate: expect.arrayContaining([
              expect.objectContaining({
                where: { name: "Tech" },
                create: { name: "Tech", slug: "tech" },
              }),
            ]),
          }),
          tags: expect.objectContaining({
            connectOrCreate: expect.arrayContaining([
              expect.objectContaining({
                where: { name: "react" },
              }),
            ]),
          }),
        }),
      })
    );
  });
});
