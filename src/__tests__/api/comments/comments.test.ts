import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { GET, POST } from "@/app/api/comments/route";

const BASE = "http://localhost/api/comments";

describe("GET /api/comments", () => {
  beforeEach(() => resetAllMocks());

  it("returns 400 when postId is missing", async () => {
    const req = new Request(BASE);
    const res = await GET(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("postId");
  });

  it("returns comments for a post", async () => {
    const comments = [
      {
        id: "c1",
        content: "Great post!",
        author: { id: "u1", name: "Commenter" },
        replies: [],
      },
    ];
    prismaMock.comment.findMany.mockResolvedValue(comments);

    const req = new Request(`${BASE}?postId=post-1`);
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].content).toBe("Great post!");
  });

  it("queries only root comments (parentId: null)", async () => {
    prismaMock.comment.findMany.mockResolvedValue([]);

    const req = new Request(`${BASE}?postId=post-1`);
    await GET(req as never);

    expect(prismaMock.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { postId: "post-1", parentId: null },
      })
    );
  });
});

describe("POST /api/comments", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = buildRequest(BASE, {
      method: "POST",
      body: { content: "Hello", postId: "post-1" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when content is missing", async () => {
    mockSession();
    const req = buildRequest(BASE, {
      method: "POST",
      body: { postId: "post-1" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when postId is missing", async () => {
    mockSession();
    const req = buildRequest(BASE, {
      method: "POST",
      body: { content: "Hello" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("creates comment successfully", async () => {
    mockSession({ id: "user-1" });
    prismaMock.comment.create.mockResolvedValue({
      id: "c1",
      content: "Nice post!",
      postId: "post-1",
      authorId: "user-1",
      author: { id: "user-1", name: "Test User" },
    });

    const req = buildRequest(BASE, {
      method: "POST",
      body: { content: "Nice post!", postId: "post-1" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.content).toBe("Nice post!");
  });

  it("creates reply with parentId", async () => {
    mockSession({ id: "user-1" });
    prismaMock.comment.create.mockResolvedValue({
      id: "c2",
      content: "Reply",
      parentId: "c1",
    });

    const req = buildRequest(BASE, {
      method: "POST",
      body: { content: "Reply", postId: "post-1", parentId: "c1" },
    });

    await POST(req as never);

    expect(prismaMock.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentId: "c1",
        }),
      })
    );
  });
});
