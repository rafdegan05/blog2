import { getFromS3 } from "@/lib/s3";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import os from "os";

const execFileAsync = promisify(execFile);

const WAVEFORM_BARS = 120;

/**
 * Fetch audio from an S3 path or HTTP URL and return a raw Buffer.
 */
async function fetchAudioBuffer(audioUrl: string): Promise<Buffer> {
  // S3 path (e.g. /uploads/audio/xyz.mp3)
  if (audioUrl.startsWith("/uploads/") || audioUrl.startsWith("uploads/")) {
    const s3Key = audioUrl.startsWith("/") ? audioUrl.slice(1) : audioUrl;
    const { buffer } = await getFromS3(s3Key);
    return buffer;
  }

  // Remote HTTP/HTTPS URL
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Convert any audio format to raw 16-bit mono PCM at 16kHz using ffmpeg,
 * then extract peak amplitudes into a normalised 0..1 array.
 */
async function extractPeaksFromBuffer(audioBuffer: Buffer, ext: string): Promise<number[]> {
  const tempDir = path.join(os.tmpdir(), `waveform-${crypto.randomBytes(4).toString("hex")}`);
  await mkdir(tempDir, { recursive: true });

  const inputPath = path.join(tempDir, `input${ext}`);
  const outputPath = path.join(tempDir, "output.raw");

  try {
    await writeFile(inputPath, audioBuffer);

    // Convert to raw 16-bit signed LE, mono, 8kHz (low rate is fine for waveform)
    await execFileAsync(
      "ffmpeg",
      ["-i", inputPath, "-ar", "8000", "-ac", "1", "-f", "s16le", "-y", outputPath],
      { timeout: 120_000 }
    );

    const rawBuf = await readFile(outputPath);
    return computePeaks(rawBuf, WAVEFORM_BARS);
  } finally {
    try {
      await unlink(inputPath);
    } catch {
      /* ignore */
    }
    try {
      await unlink(outputPath);
    } catch {
      /* ignore */
    }
    try {
      const { rmdir } = await import("fs/promises");
      await rmdir(tempDir);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Compute peak amplitudes from raw 16-bit signed LE PCM data.
 * Returns an array of `bars` values normalised to 0..1.
 */
function computePeaks(rawBuffer: Buffer, bars: number): number[] {
  const sampleCount = Math.floor(rawBuffer.length / 2); // 16-bit = 2 bytes per sample
  const step = Math.max(1, Math.floor(sampleCount / bars));
  const peaks: number[] = [];
  let globalMax = 0;

  for (let i = 0; i < bars; i++) {
    let peak = 0;
    const offset = i * step;
    for (let j = 0; j < step && offset + j < sampleCount; j++) {
      const bytePos = (offset + j) * 2;
      if (bytePos + 1 < rawBuffer.length) {
        const sample = Math.abs(rawBuffer.readInt16LE(bytePos));
        if (sample > peak) peak = sample;
      }
    }
    peaks.push(peak);
    if (peak > globalMax) globalMax = peak;
  }

  // Normalise to 0..1
  if (globalMax > 0) {
    for (let i = 0; i < peaks.length; i++) {
      peaks[i] = peaks[i] / globalMax;
    }
  }

  return peaks;
}

/**
 * Generate waveform peaks JSON for a podcast audio URL.
 * Falls back gracefully: returns null if audio cannot be processed.
 */
export async function generateWaveform(audioUrl: string): Promise<number[] | null> {
  try {
    const buffer = await fetchAudioBuffer(audioUrl);
    const ext = (path.extname(audioUrl) || ".mp3").toLowerCase();
    return await extractPeaksFromBuffer(buffer, ext);
  } catch (err) {
    console.error("[waveform] Failed to generate waveform:", err);
    return null;
  }
}
