import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canCreateContent } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Maximum file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100 MB

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
];

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function generateUniqueFilename(originalName: string): string {
  const ext = getExtension(originalName);
  const hash = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreateContent(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden – Author or Admin role required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "image"; // "image" or "audio"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const isImage = type === "image";
    const allowedTypes = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxMB} MB` },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = isImage ? "uploads/images" : "uploads/audio";
    const absoluteDir = path.join(process.cwd(), "public", uploadDir);
    await mkdir(absoluteDir, { recursive: true });

    // Generate unique filename and write file
    const uniqueName = generateUniqueFilename(file.name);
    const filePath = path.join(absoluteDir, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return the public URL
    const url = `/${uploadDir}/${uniqueName}`;

    return NextResponse.json(
      {
        url,
        filename: uniqueName,
        originalName: file.name,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
