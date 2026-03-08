import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { Role } from "@/generated/prisma/enums";

// GET /api/user/role – List all users with their roles (admin only)
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden – Admin access required" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      createdAt: true,
      _count: { select: { posts: true, podcasts: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// PUT /api/user/role – Update a user's role (admin only)
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden – Admin access required" }, { status: 403 });
  }

  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
  }

  if (!Object.values(Role).includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${Object.values(Role).join(", ")}` },
      { status: 400 }
    );
  }

  // Prevent admin from revoking their own admin role
  if (userId === session.user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot revoke your own admin role" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updatedUser);
}
