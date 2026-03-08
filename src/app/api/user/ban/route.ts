import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";

// PUT /api/user/ban – Ban or unban a user (admin only)
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden – Admin access required" }, { status: 403 });
  }

  const { userId, banned } = await request.json();

  if (!userId || typeof banned !== "boolean") {
    return NextResponse.json(
      { error: "userId and banned (boolean) are required" },
      { status: 400 }
    );
  }

  // Prevent admin from banning themselves
  if (userId === session.user.id) {
    return NextResponse.json({ error: "You cannot ban yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Don't allow banning other admins
  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Cannot ban an admin user" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      banned,
      // If banning, also invalidate all existing sessions
      ...(banned ? { tokenInvalidBefore: new Date() } : {}),
    },
    select: { id: true, name: true, email: true, banned: true },
  });

  return NextResponse.json(updatedUser);
}
