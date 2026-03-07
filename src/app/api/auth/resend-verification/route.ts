import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resetPasswordRequestSchema, formatZodErrors } from "@/lib/validations";

/**
 * POST /api/auth/resend-verification
 * Resend a verification email to the user.
 * Accepts { email } and generates a new verification token.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = resetPasswordRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: "Your email is already verified. You can sign in.",
      });
    }

    // Invalidate existing unused tokens for this user
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a new secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expires,
      },
    });

    // In production, send email with link:
    // `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
    console.log(`[Email Verification Resend] Token for ${email}: ${token}`);

    return NextResponse.json({
      message: "If an account with that email exists, a verification link has been sent.",
      // Include token in development for testing
      ...(process.env.NODE_ENV === "development" && { verificationToken: token }),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
