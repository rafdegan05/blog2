import { NextRequest, NextResponse } from "next/server";
import { getFromS3 } from "@/lib/s3";

/**
 * Serve uploaded files from S3.
 * The URL path `/uploads/images/foo.jpg` maps to S3 key `uploads/images/foo.jpg`.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Validate segments — no ".." or empty parts allowed
  if (segments.some((s) => s === ".." || s === "" || s.includes("\0"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const s3Key = `uploads/${segments.join("/")}`;

  try {
    const { buffer, contentType } = await getFromS3(s3Key);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
