/**
 * Shared helpers & mocks for API route tests.
 *
 * We mock `@/lib/prisma` and `@/lib/auth` at the module level so every
 * API route that imports them gets testable stubs.
 */

import { vi } from "vitest";

// ─── Prisma mock ────────────────────────────────────────────────────────────────

/** Recursive proxy that returns itself for any chained call (findUnique, create, …)
 *  Each method is a vi.fn() so tests can override `.mockResolvedValue()`. */
function createPrismaModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  };
}

export const prismaMock = {
  user: createPrismaModelMock(),
  post: createPrismaModelMock(),
  podcast: createPrismaModelMock(),
  comment: createPrismaModelMock(),
  category: createPrismaModelMock(),
  tag: createPrismaModelMock(),
  account: createPrismaModelMock(),
  session: createPrismaModelMock(),
  verificationToken: createPrismaModelMock(),
  emailVerificationToken: createPrismaModelMock(),
  passwordResetToken: createPrismaModelMock(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// ─── Auth mock ──────────────────────────────────────────────────────────────────

export const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

// ─── Request builder ────────────────────────────────────────────────────────────

export function buildRequest(url: string, options?: RequestInit & { body?: unknown }): Request {
  const { body, ...rest } = options ?? {};
  return new Request(url, {
    ...rest,
    ...(body !== undefined && {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...(rest.headers ?? {}) },
    }),
  });
}

// ─── Session helpers ────────────────────────────────────────────────────────────

export function mockSession(overrides?: {
  id?: string;
  role?: string;
  email?: string;
  name?: string;
}) {
  const session = {
    user: {
      id: overrides?.id ?? "user-1",
      role: overrides?.role ?? "USER",
      email: overrides?.email ?? "user@example.com",
      name: overrides?.name ?? "Test User",
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
  authMock.mockResolvedValue(session);
  return session;
}

export function mockNoSession() {
  authMock.mockResolvedValue(null);
}

// ─── Reset helpers ──────────────────────────────────────────────────────────────

export function resetAllMocks() {
  vi.clearAllMocks();
}
