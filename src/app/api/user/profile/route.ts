import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileUpdateSchema, formatZodErrors } from "@/lib/validations";

// GET /api/user/profile – Get current user's profile
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bannerImage: true,
      bio: true,
      role: true,
      notifyComments: true,
      notifyNewPosts: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          posts: true,
          podcasts: true,
          comments: true,
        },
      },
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/user/profile – Update current user's profile
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const {
    name,
    bio,
    image,
    bannerImage,
    notifyComments,
    notifyNewPosts,
    currentPassword,
    newPassword,
  } = parsed.data;

  // If changing password, verify current password first
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to set a new password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (user?.password) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }
  }

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (image !== undefined) updateData.image = image;
  if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
  if (notifyComments !== undefined) updateData.notifyComments = notifyComments;
  if (notifyNewPosts !== undefined) updateData.notifyNewPosts = notifyNewPosts;

  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bannerImage: true,
      bio: true,
      role: true,
      notifyComments: true,
      notifyNewPosts: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updatedUser);
}

// DELETE /api/user/profile – Delete current user's account
export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ message: "Account deleted successfully" });
}
