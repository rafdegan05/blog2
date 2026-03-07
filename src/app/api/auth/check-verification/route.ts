import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/check-verification
 * Called by the signin page after a failed credentials login to determine
 * whether the failure was caused by an unverified email (as opposed to
 * wrong credentials). Requires the correct password to prevent enumeration.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ needsVerification: false });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true, emailVerified: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ needsVerification: false });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Wrong password — don't reveal verification status
      return NextResponse.json({ needsVerification: false });
    }

    // Credentials are correct but email not verified
    if (!user.emailVerified) {
      return NextResponse.json({ needsVerification: true });
    }

    return NextResponse.json({ needsVerification: false });
  } catch {
    return NextResponse.json({ needsVerification: false });
  }
}
