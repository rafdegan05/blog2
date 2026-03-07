import { describe, it, expect, beforeEach } from "vitest";
import {
  prismaMock,
  buildRequest,
  mockSession,
  mockNoSession,
  resetAllMocks,
} from "@/__tests__/helpers/api-helpers";
import { GET, POST } from "@/app/api/podcasts/route";

const BASE = "http://localhost/api/podcasts";

describe("GET /api/podcasts", () => {
  beforeEach(() => resetAllMocks());

  it("returns paginated podcasts", async () => {
    const podcasts = [{ id: "pc1", title: "Episode 1" }];
    prismaMock.podcast.findMany.mockResolvedValue(podcasts);
    prismaMock.podcast.count.mockResolvedValue(1);

    const req = new Request(BASE);
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.podcasts).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("filters by published and approved moderation", async () => {
    prismaMock.podcast.findMany.mockResolvedValue([]);
    prismaMock.podcast.count.mockResolvedValue(0);

    const req = new Request(BASE);
    await GET(req as never);

    expect(prismaMock.podcast.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          published: true,
          moderation: "APPROVED",
        }),
      })
    );
  });

  it("supports search parameter", async () => {
    prismaMock.podcast.findMany.mockResolvedValue([]);
    prismaMock.podcast.count.mockResolvedValue(0);

    const req = new Request(`${BASE}?search=web`);
    await GET(req as never);

    expect(prismaMock.podcast.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: expect.objectContaining({ contains: "web" }) }),
          ]),
        }),
      })
    );
  });
});

describe("POST /api/podcasts", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();
    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Ep1", audioUrl: "https://example.com/audio.mp3" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 for USER role", async () => {
    mockSession({ role: "USER" });
    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Ep1", audioUrl: "https://example.com/audio.mp3" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    mockSession({ role: "AUTHOR" });
    const req = buildRequest(BASE, {
      method: "POST",
      body: { audioUrl: "https://example.com/audio.mp3" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when audioUrl is missing", async () => {
    mockSession({ role: "AUTHOR" });
    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Ep1" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("creates podcast successfully for AUTHOR", async () => {
    mockSession({ id: "author-1", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue(null);
    prismaMock.podcast.create.mockResolvedValue({
      id: "pc1",
      title: "Episode 1",
      slug: "episode-1",
      audioUrl: "https://example.com/audio.mp3",
    });

    const req = buildRequest(BASE, {
      method: "POST",
      body: {
        title: "Episode 1",
        audioUrl: "https://example.com/audio.mp3",
        description: "Great episode",
      },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("Episode 1");
  });

  it("generates unique slug on collision", async () => {
    mockSession({ id: "author-1", role: "AUTHOR" });
    prismaMock.podcast.findUnique.mockResolvedValue({ id: "existing" });
    prismaMock.podcast.create.mockResolvedValue({ id: "pc2", slug: "ep-1-12345" });

    const req = buildRequest(BASE, {
      method: "POST",
      body: { title: "Ep 1", audioUrl: "https://example.com/a.mp3" },
    });

    await POST(req as never);

    expect(prismaMock.podcast.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: expect.stringMatching(/^ep-1-\d+$/),
        }),
      })
    );
  });
});
