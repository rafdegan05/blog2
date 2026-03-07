import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/reset-password
 * Request a password reset. Accepts { email } and generates a token.
 * In production you'd send this via email – here we return a success
 * message regardless (to avoid user enumeration) and log the token.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Invalidate existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expires,
      },
    });

    // In production, send email with link:
    // `${process.env.NEXTAUTH_URL}/auth/reset-password/confirm?token=${token}`
    console.log(`[Password Reset] Token for ${email}: ${token}`);

    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
      // Include token in development for testing
      ...(process.env.NODE_ENV === "development" && { token }),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
