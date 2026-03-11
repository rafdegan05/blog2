/**
 * Caption/subtitle parsing and serialization utilities.
 * Supports SRT, VTT, and plain-text transcript formats.
 */

export type CaptionFormat = "srt" | "vtt" | "txt";

export interface CaptionCue {
  id: string;
  index: number;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

/* ───────────────────────── Time helpers ───────────────────────── */

/** Parse "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" (VTT) → seconds */
export function parseTimestamp(ts: string): number {
  const cleaned = ts.trim().replace(",", ".");
  const parts = cleaned.split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(cleaned) || 0;
}

/** seconds → "HH:MM:SS.mmm" */
export function formatTimestampVTT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad3(ms)}`;
}

/** seconds → "HH:MM:SS,mmm" */
export function formatTimestampSRT(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}

/** seconds → "MM:SS" for display */
export function formatTimestampShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${pad2(m)}:${pad2(s)}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

/* ───────────────────────── Detect format ───────────────────────── */

export function detectFormat(content: string): CaptionFormat {
  const trimmed = content.trim();
  if (trimmed.startsWith("WEBVTT")) return "vtt";
  // SRT: first non-empty line is a number, next line has --> with comma timestamps
  const lines = trimmed.split(/\r?\n/);
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].includes("-->") && lines[i].includes(",")) return "srt";
    if (lines[i].includes("-->") && lines[i].includes(".")) return "vtt";
  }
  // Check for [MM:SS] plain text format
  if (/^\[?\d{1,2}:\d{2}/.test(trimmed)) return "txt";
  return "txt";
}

/* ───────────────────────── Parse SRT ───────────────────────── */

export function parseSRT(content: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length < 2) continue;

    // Find the timestamp line
    let tsLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsMatch = lines[tsLineIdx].match(
      /(\d{1,2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{3})/
    );
    if (!tsMatch) continue;

    const startTime = parseTimestamp(tsMatch[1]);
    const endTime = parseTimestamp(tsMatch[2]);
    const text = lines
      .slice(tsLineIdx + 1)
      .join("\n")
      .trim();
    const index = cues.length;

    cues.push({
      id: `cue-${index}`,
      index,
      startTime,
      endTime,
      text,
    });
  }

  return cues;
}

/* ───────────────────────── Parse VTT ───────────────────────── */

export function parseVTT(content: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  // Remove WEBVTT header and optional metadata
  let body = content.replace(/^WEBVTT[^\n]*\n/, "").trim();
  // Remove NOTE blocks
  body = body.replace(/^NOTE\b[^\n]*\n(?:[^\n]+\n)*/gm, "").trim();

  const blocks = body.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length < 1) continue;

    let tsLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        tsLineIdx = i;
        break;
      }
    }
    if (tsLineIdx === -1) continue;

    const tsMatch = lines[tsLineIdx].match(
      /(\d{1,2}:\d{2}:\d{2}[,.]\d{3}|\d{1,2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{3}|\d{1,2}:\d{2}[,.]\d{3})/
    );
    if (!tsMatch) continue;

    const startTime = parseTimestamp(tsMatch[1]);
    const endTime = parseTimestamp(tsMatch[2]);
    const text = lines
      .slice(tsLineIdx + 1)
      .join("\n")
      .trim();
    const index = cues.length;

    cues.push({
      id: `cue-${index}`,
      index,
      startTime,
      endTime,
      text,
    });
  }

  return cues;
}

/* ───────────────────── Parse plain-text transcript ─────────────────────── */

/**
 * Parses "[MM:SS] text" format (Whisper output) or plain text.
 * For plain text without timestamps, creates a single cue.
 */
export function parsePlainText(content: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const lines = content.trim().split(/\r?\n/);
  const tsRegex = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)/;

  let hasTimestamps = false;

  for (const line of lines) {
    const match = line.match(tsRegex);
    if (match) {
      hasTimestamps = true;
      const startTime = parseTimestamp(match[1]);
      const text = match[2].trim();
      if (!text) continue;

      cues.push({
        id: `cue-${cues.length}`,
        index: cues.length,
        startTime,
        endTime: 0, // will be filled after
        text,
      });
    }
  }

  if (hasTimestamps && cues.length > 0) {
    // Fill end times: each cue ends when the next begins
    for (let i = 0; i < cues.length - 1; i++) {
      cues[i].endTime = cues[i + 1].startTime;
    }
    // Last cue: add 5 seconds
    cues[cues.length - 1].endTime = cues[cues.length - 1].startTime + 5;
    return cues;
  }

  // No timestamps: create one big cue per paragraph
  const paragraphs = content.trim().split(/\n\s*\n/);
  const durationPer = 30; // ~30 seconds per paragraph
  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i].trim();
    if (!text) continue;
    cues.push({
      id: `cue-${cues.length}`,
      index: cues.length,
      startTime: i * durationPer,
      endTime: (i + 1) * durationPer,
      text,
    });
  }

  return cues;
}

/* ───────────────────────── Auto-parse ───────────────────────── */

export function parseCaptions(content: string): { cues: CaptionCue[]; format: CaptionFormat } {
  const format = detectFormat(content);
  let cues: CaptionCue[];

  switch (format) {
    case "srt":
      cues = parseSRT(content);
      break;
    case "vtt":
      cues = parseVTT(content);
      break;
    default:
      cues = parsePlainText(content);
  }

  // Re-index
  cues.forEach((c, i) => {
    c.index = i;
    c.id = `cue-${i}`;
  });

  return { cues, format };
}

/* ───────────────────────── Serialize ───────────────────────── */

export function serializeToSRT(cues: CaptionCue[]): string {
  return cues
    .map(
      (cue, i) =>
        `${i + 1}\n${formatTimestampSRT(cue.startTime)} --> ${formatTimestampSRT(cue.endTime)}\n${cue.text}`
    )
    .join("\n\n");
}

export function serializeToVTT(cues: CaptionCue[]): string {
  const body = cues
    .map(
      (cue) =>
        `${formatTimestampVTT(cue.startTime)} --> ${formatTimestampVTT(cue.endTime)}\n${cue.text}`
    )
    .join("\n\n");
  return `WEBVTT\n\n${body}`;
}

export function serializeToPlainText(cues: CaptionCue[]): string {
  return cues.map((cue) => `[${formatTimestampShort(cue.startTime)}] ${cue.text}`).join("\n");
}

export function serializeCaptions(cues: CaptionCue[], format: CaptionFormat): string {
  switch (format) {
    case "srt":
      return serializeToSRT(cues);
    case "vtt":
      return serializeToVTT(cues);
    default:
      return serializeToPlainText(cues);
  }
}

/* ───────────────────── Language codes for Whisper ───────────────────── */

export const WHISPER_LANGUAGES = [
  { code: "en", label: "English", labelIt: "Inglese" },
  { code: "it", label: "Italian", labelIt: "Italiano" },
  { code: "es", label: "Spanish", labelIt: "Spagnolo" },
  { code: "fr", label: "French", labelIt: "Francese" },
  { code: "de", label: "German", labelIt: "Tedesco" },
  { code: "pt", label: "Portuguese", labelIt: "Portoghese" },
  { code: "nl", label: "Dutch", labelIt: "Olandese" },
  { code: "ru", label: "Russian", labelIt: "Russo" },
  { code: "zh", label: "Chinese", labelIt: "Cinese" },
  { code: "ja", label: "Japanese", labelIt: "Giapponese" },
  { code: "ko", label: "Korean", labelIt: "Coreano" },
  { code: "ar", label: "Arabic", labelIt: "Arabo" },
  { code: "hi", label: "Hindi", labelIt: "Hindi" },
  { code: "pl", label: "Polish", labelIt: "Polacco" },
  { code: "tr", label: "Turkish", labelIt: "Turco" },
  { code: "sv", label: "Swedish", labelIt: "Svedese" },
  { code: "da", label: "Danish", labelIt: "Danese" },
  { code: "fi", label: "Finnish", labelIt: "Finlandese" },
  { code: "no", label: "Norwegian", labelIt: "Norvegese" },
  { code: "uk", label: "Ukrainian", labelIt: "Ucraino" },
  { code: "cs", label: "Czech", labelIt: "Ceco" },
  { code: "ro", label: "Romanian", labelIt: "Rumeno" },
  { code: "el", label: "Greek", labelIt: "Greco" },
  { code: "hu", label: "Hungarian", labelIt: "Ungherese" },
  { code: "ca", label: "Catalan", labelIt: "Catalano" },
] as const;

export type WhisperLanguageCode = (typeof WHISPER_LANGUAGES)[number]["code"];
