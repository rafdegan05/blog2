import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canCreateContent } from "@/lib/permissions";
import { detectLanguage } from "@/lib/language-detect";
import { getFromS3, existsInS3 } from "@/lib/s3";
import { readFile, writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

export const maxDuration = 300; // 5 minutes timeout for long audio files

/**
 * Decode a WAV buffer into a Float32Array of mono PCM samples at 16kHz.
 * Falls back to ffmpeg for non-WAV formats (mp3, ogg, aac, etc.).
 */
async function decodeAudioToFloat32(
  audioBuffer: Buffer,
  tempDir: string,
  originalExt: string
): Promise<Float32Array> {
  const TARGET_SAMPLE_RATE = 16000;

  // Try native WAV decoding first
  if (originalExt === ".wav") {
    try {
      return decodeWav(audioBuffer, TARGET_SAMPLE_RATE);
    } catch {
      // Fall through to ffmpeg
    }
  }

  // For non-WAV formats (or failed WAV decode), use ffmpeg to convert
  return await convertWithFfmpeg(audioBuffer, tempDir, originalExt, TARGET_SAMPLE_RATE);
}

/**
 * Decode a WAV file from buffer to Float32Array, resampling to targetSampleRate.
 */
function decodeWav(buffer: Buffer, targetSampleRate: number): Float32Array {
  // Parse RIFF header
  const riff = buffer.toString("ascii", 0, 4);
  if (riff !== "RIFF") throw new Error("Not a valid WAV file");

  const wave = buffer.toString("ascii", 8, 12);
  if (wave !== "WAVE") throw new Error("Not a valid WAV file");

  // Find fmt chunk
  let offset = 12;
  let audioFormat = 0;
  let numChannels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataStart = 0;
  let dataSize = 0;

  while (offset < buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === "fmt ") {
      audioFormat = buffer.readUInt16LE(offset + 8);
      numChannels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      bitsPerSample = buffer.readUInt16LE(offset + 22);
    } else if (chunkId === "data") {
      dataStart = offset + 8;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    // Align to 2-byte boundary
    if (chunkSize % 2 !== 0) offset += 1;
  }

  if (dataStart === 0) throw new Error("No data chunk found in WAV");
  if (audioFormat !== 1) throw new Error("Only PCM WAV is supported for direct decode");

  // Read PCM samples
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataSize / (bytesPerSample * numChannels));
  const mono = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      const pos = dataStart + i * numChannels * bytesPerSample + ch * bytesPerSample;
      if (bitsPerSample === 16) {
        sample += buffer.readInt16LE(pos) / 32768.0;
      } else if (bitsPerSample === 32) {
        sample += buffer.readInt32LE(pos) / 2147483648.0;
      } else if (bitsPerSample === 8) {
        sample += (buffer.readUInt8(pos) - 128) / 128.0;
      }
    }
    mono[i] = sample / numChannels; // Mix to mono
  }

  // Resample if needed
  if (sampleRate === targetSampleRate) return mono;
  return resample(mono, sampleRate, targetSampleRate);
}

/** Simple linear interpolation resampler */
function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = fromRate / toRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, input.length - 1);
    const frac = srcIndex - low;
    output[i] = input[low] * (1 - frac) + input[high] * frac;
  }

  return output;
}

/** Convert audio to 16kHz mono WAV using ffmpeg, then decode */
async function convertWithFfmpeg(
  audioBuffer: Buffer,
  tempDir: string,
  originalExt: string,
  targetSampleRate: number
): Promise<Float32Array> {
  const inputPath = path.join(
    tempDir,
    `input-${crypto.randomBytes(4).toString("hex")}${originalExt}`
  );
  const outputPath = path.join(tempDir, `output-${crypto.randomBytes(4).toString("hex")}.wav`);

  try {
    await writeFile(inputPath, audioBuffer);

    await execFileAsync(
      "ffmpeg",
      [
        "-i",
        inputPath,
        "-ar",
        String(targetSampleRate),
        "-ac",
        "1", // mono
        "-sample_fmt",
        "s16", // 16-bit PCM
        "-f",
        "wav",
        "-y",
        outputPath,
      ],
      { timeout: 60000 }
    );

    const wavBuffer = await readFile(outputPath);
    return decodeWav(wavBuffer, targetSampleRate);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("ENOENT") || msg.includes("not found") || msg.includes("not recognized")) {
      throw new Error(
        "Cannot decode this audio format. Please upload a WAV file, " +
          "or install ffmpeg on the server to support MP3/OGG/AAC formats."
      );
    }
    throw error;
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
  }
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

    const { audioUrl, language, format } = await request.json();

    if (!audioUrl || typeof audioUrl !== "string") {
      return NextResponse.json({ error: "audioUrl is required" }, { status: 400 });
    }

    // Language for Whisper: "auto" or empty/missing means auto-detect
    const isAutoDetect = !language || language === "auto";
    const whisperLang = isAutoDetect
      ? null
      : typeof language === "string" && language.length >= 2
        ? language.slice(0, 2).toLowerCase()
        : null;

    // Output format: "srt" | "vtt" | "txt" (default: "srt")
    const outputFormat =
      typeof format === "string" && ["srt", "vtt", "txt"].includes(format) ? format : "srt";

    // Read audio file from S3 or remote URL
    let audioBuffer: Buffer;

    if (audioUrl.startsWith("/uploads/")) {
      // S3 file – key is the path without leading slash
      const s3Key = audioUrl.replace(/^\//, "");

      // Verify the file exists in S3
      const exists = await existsInS3(s3Key);
      if (!exists) {
        return NextResponse.json(
          { error: `Audio file not found: ${audioUrl}. Please upload the file first.` },
          { status: 404 }
        );
      }

      const result = await getFromS3(s3Key);
      audioBuffer = result.buffer;
    } else if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      // Remote file – download it
      const response = await fetch(audioUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch remote audio file" }, { status: 400 });
      }
      audioBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      return NextResponse.json({ error: "Unsupported audio URL format" }, { status: 400 });
    }

    // Decode audio to Float32Array at 16kHz mono (Whisper's expected format)
    const tempDir = path.join(os.tmpdir(), "podcast-transcribe");
    await mkdir(tempDir, { recursive: true });
    const ext = (path.extname(audioUrl) || ".wav").toLowerCase();
    const audioData = await decodeAudioToFloat32(audioBuffer, tempDir, ext);

    // Import @huggingface/transformers – listed in serverExternalPackages so
    // webpack keeps it as an external require and the standalone tracer copies
    // the package into .next/standalone/node_modules.
    const { pipeline } = await import("@huggingface/transformers");

    // Create automatic speech recognition pipeline with Whisper
    const cacheDir = process.env.HF_CACHE_DIR || path.join(os.homedir(), ".cache", "huggingface");
    await mkdir(cacheDir, { recursive: true });
    const transcriber = await pipeline(
      "automatic-speech-recognition",
      "onnx-community/whisper-small",
      {
        dtype: "q4", // Use quantized model for faster inference
        device: "cpu",
        cache_dir: cacheDir,
      }
    );

    // Pass raw audio data directly — no AudioContext needed
    const result = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      ...(whisperLang ? { language: whisperLang } : {}),
    });

    // Clean up
    await transcriber.dispose();

    // Format transcript with timestamps
    // When return_timestamps is true, result.chunks contains
    // { text: string, timestamp: [start, end] }[]
    interface TranscriptChunk {
      text: string;
      timestamp: [number, number | null];
    }

    function pad2(n: number): string {
      return n.toString().padStart(2, "0");
    }

    function pad3(n: number): string {
      return n.toString().padStart(3, "0");
    }

    function formatTimestampSRT(seconds: number): string {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
      return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
    }

    function formatTimestampVTT(seconds: number): string {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
      return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad3(ms)}`;
    }

    function formatTimestampShort(seconds: number): string {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
      return `${pad2(m)}:${pad2(s)}`;
    }

    let transcriptText: string;

    const chunks: TranscriptChunk[] = Array.isArray(result)
      ? result.flatMap((r: { chunks?: TranscriptChunk[] }) => r.chunks ?? [])
      : ((result as { chunks?: TranscriptChunk[] }).chunks ?? []);

    if (chunks.length > 0) {
      if (outputFormat === "srt") {
        // SRT format
        transcriptText = chunks
          .map((chunk, i) => {
            const start = formatTimestampSRT(chunk.timestamp[0] ?? 0);
            const end = formatTimestampSRT(chunk.timestamp[1] ?? (chunk.timestamp[0] ?? 0) + 5);
            return `${i + 1}\n${start} --> ${end}\n${chunk.text.trim()}`;
          })
          .join("\n\n");
      } else if (outputFormat === "vtt") {
        // VTT format
        const body = chunks
          .map((chunk) => {
            const start = formatTimestampVTT(chunk.timestamp[0] ?? 0);
            const end = formatTimestampVTT(chunk.timestamp[1] ?? (chunk.timestamp[0] ?? 0) + 5);
            return `${start} --> ${end}\n${chunk.text.trim()}`;
          })
          .join("\n\n");
        transcriptText = `WEBVTT\n\n${body}`;
      } else {
        // Plain text with [MM:SS] timestamps
        transcriptText = chunks
          .map((chunk) => {
            const start = formatTimestampShort(chunk.timestamp[0] ?? 0);
            return `[${start}] ${chunk.text.trim()}`;
          })
          .join("\n");
      }
    } else {
      // Fallback: plain text without timestamps
      transcriptText = Array.isArray(result)
        ? result.map((r: { text: string }) => r.text).join(" ")
        : (result as { text: string }).text;
    }

    const finalText = transcriptText.trim();

    // Detect language from transcript text when auto-detect was requested
    let detectedLang = whisperLang || "en";
    let detectedLanguage: string | undefined;
    if (isAutoDetect) {
      const detection = detectLanguage(finalText);
      if (detection) {
        detectedLang = detection.language;
        detectedLanguage = detection.language;
      }
    }

    return NextResponse.json(
      {
        transcript: finalText,
        language: detectedLang,
        detectedLanguage,
        format: outputFormat,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Transcription error:", error);
    const message =
      error instanceof Error ? error.message : "Transcription failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
