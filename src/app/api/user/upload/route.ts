import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";
import path from "path";
import crypto from "crypto";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const hash = crypto.randomBytes(16).toString("hex");
  return `${Date.now()}-${hash}${ext}`;
}

// POST /api/user/upload – Upload avatar or banner image (any authenticated user)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const field = formData.get("field") as string | null; // "avatar" or "banner"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!field || !["avatar", "banner"].includes(field)) {
      return NextResponse.json(
        { error: 'Invalid field. Must be "avatar" or "banner"' },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size: 5 MB" }, { status: 400 });
    }

    const uploadDir = `uploads/profiles/${field}s`;
    const uniqueName = generateUniqueFilename(file.name);
    const s3Key = `${uploadDir}/${uniqueName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadToS3(buffer, s3Key, file.type);

    const url = `/${s3Key}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Profile upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
