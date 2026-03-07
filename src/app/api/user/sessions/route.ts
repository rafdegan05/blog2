import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/user/sessions
 * Invalidate all sessions for the current user (sign out everywhere).
 * Sets tokenInvalidBefore to now, which causes JWT validation to fail
 * for all tokens issued before this timestamp.
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { tokenInvalidBefore: new Date() },
  });

  return NextResponse.json({
    message: "All sessions have been invalidated. You will need to sign in again.",
  });
}
