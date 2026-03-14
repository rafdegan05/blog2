import { NextRequest, NextResponse } from "next/server";
import { getFromS3, getS3ObjectInfo, getS3Range } from "@/lib/s3";

/**
 * Serve uploaded files from S3 with HTTP Range request support.
 * The URL path `/uploads/images/foo.jpg` maps to S3 key `uploads/images/foo.jpg`.
 *
 * Range requests are essential for audio/video seeking in the browser.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Validate segments — no ".." or empty parts allowed
  if (segments.some((s) => s === ".." || s === "" || s.includes("\0"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const s3Key = `uploads/${segments.join("/")}`;
  const rangeHeader = request.headers.get("range");

  try {
    // If the browser sent a Range header, stream only the requested bytes
    if (rangeHeader) {
      const { contentLength, contentType } = await getS3ObjectInfo(s3Key);
      const total = contentLength;

      // Parse "bytes=START-END"
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (!match) {
        return new NextResponse("Invalid Range", { status: 416 });
      }

      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : total - 1;

      if (start >= total || end >= total || start > end) {
        return new NextResponse("Range Not Satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }

      const { buffer } = await getS3Range(s3Key, start, end);
      const chunkSize = end - start + 1;

      return new NextResponse(new Uint8Array(buffer), {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Full file request (no Range header)
    const { buffer, contentType } = await getFromS3(s3Key);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
