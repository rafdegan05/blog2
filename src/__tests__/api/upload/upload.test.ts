// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockSession, mockNoSession, resetAllMocks } from "@/__tests__/helpers/api-helpers";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/upload/route";

function createFormData(fields: Record<string, string | File>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

function createMockFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

const BASE = "http://localhost/api/upload";

describe("POST /api/upload", () => {
  beforeEach(() => resetAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockNoSession();

    const fd = createFormData({
      file: createMockFile("test.jpg", "image/jpeg", 1024),
      type: "image",
    });

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 for USER role", async () => {
    mockSession({ role: "USER" });

    const fd = createFormData({
      file: createMockFile("test.jpg", "image/jpeg", 1024),
      type: "image",
    });

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 400 when no file provided", async () => {
    mockSession({ role: "AUTHOR" });

    const fd = new FormData();
    fd.append("type", "image");

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No file");
  });

  it("returns 400 for invalid image type", async () => {
    mockSession({ role: "AUTHOR" });

    const fd = createFormData({
      file: createMockFile("test.exe", "application/octet-stream", 1024),
      type: "image",
    });

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid file type");
  });

  it("returns 400 for invalid audio type", async () => {
    mockSession({ role: "AUTHOR" });

    const fd = createFormData({
      file: createMockFile("test.txt", "text/plain", 1024),
      type: "audio",
    });

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid file type");
  });

  it("returns 400 when image exceeds 5 MB", async () => {
    mockSession({ role: "AUTHOR" });

    const fd = createFormData({
      file: createMockFile("big.jpg", "image/jpeg", 6 * 1024 * 1024),
      type: "image",
    });

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("too large");
  });

  it("uploads image successfully for AUTHOR", async () => {
    mockSession({ role: "AUTHOR" });

    const fd = createFormData({
      file: createMockFile("photo.png", "image/png", 1024),
      type: "image",
    });

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.url).toMatch(/^\/uploads\/images\//);
    expect(data.url).toContain(".png");
    expect(data.originalName).toBe("photo.png");
    expect(data.size).toBe(1024);
  });

  it("uploads audio successfully for ADMIN", async () => {
    mockSession({ role: "ADMIN" });

    const fd = createFormData({
      file: createMockFile("episode.mp3", "audio/mpeg", 2048),
      type: "audio",
    });

    const req = new Request(BASE, { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.url).toMatch(/^\/uploads\/audio\//);
    expect(data.url).toContain(".mp3");
  });
});
