"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  type CaptionCue,
  type CaptionFormat,
  type WhisperLanguageCode,
  parseCaptions,
  serializeCaptions,
  serializeToSRT,
  serializeToVTT,
  serializeToPlainText,
  formatTimestampVTT,
  formatTimestampShort,
  parseTimestamp,
  WHISPER_LANGUAGES,
} from "@/lib/captions";
import { useTranslation } from "@/components/LanguageProvider";

/* ─────────────────────────── Types ─────────────────────────── */

interface CaptionEditorProps {
  /** Raw transcript string (SRT / VTT / plain text) */
  value: string;
  /** Called when the transcript changes */
  onChange: (value: string) => void;
  /** Audio URL for the episode */
  audioUrl?: string;
  /** Whether generate is in progress */
  generating?: boolean;
  /** Called to start generation with language + format */
  onGenerate?: (language: WhisperLanguageCode, format: CaptionFormat) => void;
  /** Disabled state */
  disabled?: boolean;
}

/* ─────────────────────────── Component ─────────────────────────── */

export default function CaptionEditor({
  value,
  onChange,
  audioUrl,
  generating = false,
  onGenerate,
  disabled = false,
}: CaptionEditorProps) {
  const { t, language: uiLang } = useTranslation();

  /* ── State ── */
  const [formatOverride, setFormatOverride] = useState<CaptionFormat | null>(null);
  const [selectedCueId, setSelectedCueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [transcriptLang, setTranscriptLang] = useState<WhisperLanguageCode>("en");
  const [viewMode, setViewMode] = useState<"editor" | "source">("editor");
  const [sourceText, setSourceText] = useState(value);
  const [sourceInitValue, setSourceInitValue] = useState(value);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cueListRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  /* ── Derive cues + format from the value prop ── */
  const { cues, detectedFormat } = useMemo(() => {
    if (!value) return { cues: [] as CaptionCue[], detectedFormat: "srt" as CaptionFormat };
    const { cues: parsed, format: fmt } = parseCaptions(value);
    return { cues: parsed, detectedFormat: fmt };
  }, [value]);

  const format: CaptionFormat = formatOverride ?? detectedFormat;
  const setFormat = setFormatOverride;

  /* ── Reset sourceText when value changes externally ── */
  if (value !== sourceInitValue) {
    setSourceInitValue(value);
    setSourceText(value);
  }

  /* ── Sync changes back ── */
  const emitChange = useCallback(
    (newCues: CaptionCue[], fmt?: CaptionFormat) => {
      const f = fmt ?? format;
      const serialized = serializeCaptions(newCues, f);
      onChange(serialized);
    },
    [format, onChange]
  );

  /* ── Audio integration ── */
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onTime = () => setAudioTime(audio.currentTime);
    const onDuration = () => setAudioDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  /* ── Active cue based on playback position ── */
  const activeCueId = useMemo(() => {
    if (!isPlaying && !audioTime) return null;
    const active = cues.find((c) => audioTime >= c.startTime && audioTime < c.endTime);
    return active?.id ?? null;
  }, [audioTime, cues, isPlaying]);

  /* ── Auto-scroll to active cue ── */
  useEffect(() => {
    if (!activeCueId || !cueListRef.current) return;
    const el = cueListRef.current.querySelector(`[data-cue-id="${activeCueId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeCueId]);

  /* ── Filtered cues ── */
  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return cues;
    const q = searchQuery.toLowerCase();
    return cues.filter((c) => c.text.toLowerCase().includes(q));
  }, [cues, searchQuery]);

  /* ── Handlers ── */

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
    }
  }, []);

  const handleCueTextChange = useCallback(
    (id: string, newText: string) => {
      const updated = cues.map((c) => (c.id === id ? { ...c, text: newText } : c));
      emitChange(updated);
    },
    [cues, emitChange]
  );

  const handleCueTimeChange = useCallback(
    (id: string, field: "startTime" | "endTime", timeStr: string) => {
      const seconds = parseTimestamp(timeStr);
      const updated = cues.map((c) => (c.id === id ? { ...c, [field]: seconds } : c));
      emitChange(updated);
    },
    [cues, emitChange]
  );

  const handleAddCue = useCallback(() => {
    const lastCue = cues[cues.length - 1];
    const startTime = lastCue ? lastCue.endTime : 0;
    const endTime = startTime + 5;
    const newCue: CaptionCue = {
      id: `cue-${Date.now()}`,
      index: cues.length,
      startTime,
      endTime,
      text: "",
    };
    const updated = [...cues, newCue];
    setSelectedCueId(newCue.id);
    emitChange(updated);
  }, [cues, emitChange]);

  const handleInsertCue = useCallback(
    (afterIndex: number) => {
      const current = cues[afterIndex];
      const next = cues[afterIndex + 1];
      const startTime = current ? current.endTime : 0;
      const endTime = next ? next.startTime : startTime + 5;
      const newCue: CaptionCue = {
        id: `cue-${Date.now()}`,
        index: afterIndex + 1,
        startTime,
        endTime,
        text: "",
      };
      const updated = [...cues.slice(0, afterIndex + 1), newCue, ...cues.slice(afterIndex + 1)];
      // Re-index
      updated.forEach((c, i) => {
        c.index = i;
      });
      setSelectedCueId(newCue.id);
      emitChange(updated);
    },
    [cues, emitChange]
  );

  const handleDeleteCue = useCallback(
    (id: string) => {
      const updated = cues.filter((c) => c.id !== id);
      updated.forEach((c, i) => {
        c.index = i;
      });
      if (selectedCueId === id) setSelectedCueId(null);
      emitChange(updated);
    },
    [cues, selectedCueId, emitChange]
  );

  const handleMergeCues = useCallback(
    (id: string) => {
      const idx = cues.findIndex((c) => c.id === id);
      if (idx < 0 || idx >= cues.length - 1) return;
      const current = cues[idx];
      const next = cues[idx + 1];
      const merged: CaptionCue = {
        ...current,
        endTime: next.endTime,
        text: `${current.text} ${next.text}`.trim(),
      };
      const updated = [...cues.slice(0, idx), merged, ...cues.slice(idx + 2)];
      updated.forEach((c, i) => {
        c.index = i;
      });
      emitChange(updated);
    },
    [cues, emitChange]
  );

  const handleSplitCue = useCallback(
    (id: string) => {
      const idx = cues.findIndex((c) => c.id === id);
      if (idx < 0) return;
      const cue = cues[idx];
      const midTime = (cue.startTime + cue.endTime) / 2;
      const words = cue.text.split(/\s+/);
      const midWord = Math.ceil(words.length / 2);
      const first: CaptionCue = {
        ...cue,
        endTime: midTime,
        text: words.slice(0, midWord).join(" "),
      };
      const second: CaptionCue = {
        id: `cue-${Date.now()}`,
        index: idx + 1,
        startTime: midTime,
        endTime: cue.endTime,
        text: words.slice(midWord).join(" "),
      };
      const updated = [...cues.slice(0, idx), first, second, ...cues.slice(idx + 1)];
      updated.forEach((c, i) => {
        c.index = i;
      });
      emitChange(updated);
    },
    [cues, emitChange]
  );

  const handleSetStartFromPlayhead = useCallback(
    (id: string) => {
      const updated = cues.map((c) => (c.id === id ? { ...c, startTime: audioTime } : c));
      emitChange(updated);
    },
    [cues, audioTime, emitChange]
  );

  const handleSetEndFromPlayhead = useCallback(
    (id: string) => {
      const updated = cues.map((c) => (c.id === id ? { ...c, endTime: audioTime } : c));
      emitChange(updated);
    },
    [cues, audioTime, emitChange]
  );

  const handleFormatChange = useCallback(
    (newFormat: CaptionFormat) => {
      setFormat(newFormat);
      if (cues.length > 0) {
        emitChange(cues, newFormat);
      }
    },
    [cues, emitChange, setFormat]
  );

  const handleImportFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          onChange(text);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [onChange]
  );

  const handleDownload = useCallback(
    (downloadFormat: CaptionFormat) => {
      let content: string;
      let ext: string;
      let mimeType: string;

      switch (downloadFormat) {
        case "srt":
          content = serializeToSRT(cues);
          ext = "srt";
          mimeType = "application/x-subrip";
          break;
        case "vtt":
          content = serializeToVTT(cues);
          ext = "vtt";
          mimeType = "text/vtt";
          break;
        default:
          content = serializeToPlainText(cues);
          ext = "txt";
          mimeType = "text/plain";
      }

      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [cues]
  );

  const handleSourceChange = useCallback((text: string) => {
    setSourceText(text);
  }, []);

  const handleApplySource = useCallback(() => {
    onChange(sourceText);
  }, [sourceText, onChange]);

  const handleClear = useCallback(() => {
    setSourceText("");
    onChange("");
  }, [onChange]);

  const handleGenerate = useCallback(() => {
    if (onGenerate) {
      onGenerate(transcriptLang, format);
    }
  }, [onGenerate, transcriptLang, format]);

  const langOptions = useMemo(() => {
    return WHISPER_LANGUAGES.map((l) => ({
      code: l.code,
      label: uiLang === "it" ? l.labelIt : l.label,
    }));
  }, [uiLang]);

  /* ─────────────────────────── Render ─────────────────────────── */

  return (
    <div className="caption-editor">
      {/* ── Toolbar ── */}
      <div className="caption-editor-toolbar">
        {/* Left: actions */}
        <div className="caption-editor-toolbar-left">
          {/* Import */}
          <button
            type="button"
            onClick={handleImportFile}
            className="btn btn-outline btn-xs gap-1"
            disabled={disabled}
            title={t.podcasts.importTranscript}
          >
            <UploadIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.podcasts.importTranscript}</span>
          </button>

          {/* Generate with language */}
          <div className="caption-editor-generate-group">
            <select
              className="select select-bordered select-xs caption-editor-lang-select"
              value={transcriptLang}
              onChange={(e) => setTranscriptLang(e.target.value as WhisperLanguageCode)}
              disabled={disabled || generating}
            >
              {langOptions.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleGenerate}
              className="btn btn-secondary btn-xs gap-1"
              disabled={disabled || generating || !audioUrl}
              title={t.podcasts.generateTranscript}
            >
              {generating ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <SparkleIcon className="w-3.5 h-3.5" />
              )}
              {generating ? t.podcasts.generatingTranscript : t.podcasts.generateTranscript}
            </button>
          </div>

          {/* Format selector */}
          <div className="caption-editor-format-group">
            <span className="text-xs opacity-50">{t.podcasts.captionFormat}:</span>
            {(["srt", "vtt", "txt"] as CaptionFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleFormatChange(f)}
                className={`btn btn-xs ${format === f ? "btn-primary" : "btn-ghost"}`}
                disabled={disabled}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Right: view toggle + actions */}
        <div className="caption-editor-toolbar-right">
          {/* Download dropdown */}
          {cues.length > 0 && (
            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-xs gap-1"
                disabled={disabled}
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.podcasts.downloadTranscript}</span>
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-1 shadow-lg bg-base-200 rounded-box w-32"
              >
                <li>
                  <button type="button" onClick={() => handleDownload("srt")}>
                    SRT
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => handleDownload("vtt")}>
                    VTT
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => handleDownload("txt")}>
                    TXT
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* View toggle */}
          <div className="btn-group caption-editor-view-toggle">
            <button
              type="button"
              className={`btn btn-xs ${viewMode === "editor" ? "btn-active" : ""}`}
              onClick={() => setViewMode("editor")}
            >
              <GridIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.podcasts.captionEditorView}</span>
            </button>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === "source" ? "btn-active" : ""}`}
              onClick={() => setViewMode("source")}
            >
              <CodeIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.podcasts.captionSourceView}</span>
            </button>
          </div>

          {/* Clear */}
          {(cues.length > 0 || sourceText) && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-ghost btn-xs text-error gap-1"
              disabled={disabled}
            >
              <XIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.podcasts.clearTranscript}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Mini audio player (inline) ── */}
      {audioUrl && viewMode === "editor" && (
        <div className="caption-editor-player">
          <button
            type="button"
            onClick={togglePlayPause}
            className="btn btn-circle btn-xs btn-primary"
          >
            {isPlaying ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
          </button>
          <span className="caption-editor-time">
            {formatTimestampShort(audioTime)} / {formatTimestampShort(audioDuration || 0)}
          </span>
          <input
            type="range"
            min={0}
            max={audioDuration || 0}
            step={0.1}
            value={audioTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="range range-xs range-primary flex-1"
          />
        </div>
      )}

      {/* ── Search bar ── */}
      {viewMode === "editor" && cues.length > 0 && (
        <div className="caption-editor-search">
          <SearchIcon className="w-3.5 h-3.5 opacity-40" />
          <input
            type="text"
            placeholder={t.podcasts.captionSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="caption-editor-search-input"
          />
          <span className="text-xs opacity-40">
            {filteredCues.length}/{cues.length}
          </span>
        </div>
      )}

      {/* ── Editor view ── */}
      {viewMode === "editor" ? (
        <div className="caption-editor-cue-list" ref={cueListRef}>
          {cues.length === 0 ? (
            <div className="caption-editor-empty">
              <TranscriptIcon className="w-10 h-10 opacity-20" />
              <p className="text-sm opacity-50">{t.podcasts.captionEmptyState}</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleAddCue}
                  className="btn btn-outline btn-sm gap-1"
                  disabled={disabled}
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  {t.podcasts.captionAddCue}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Column header */}
              <div className="caption-editor-header-row">
                <span className="caption-editor-col-index">#</span>
                <span className="caption-editor-col-time">{t.podcasts.captionStart}</span>
                <span className="caption-editor-col-time">{t.podcasts.captionEnd}</span>
                <span className="caption-editor-col-text">{t.podcasts.captionText}</span>
                <span className="caption-editor-col-actions"></span>
              </div>

              {filteredCues.map((cue) => (
                <CueRow
                  key={cue.id}
                  cue={cue}
                  isActive={activeCueId === cue.id}
                  isSelected={selectedCueId === cue.id}
                  disabled={disabled}
                  onSelect={() => setSelectedCueId(cue.id)}
                  onSeek={() => seekTo(cue.startTime)}
                  onTextChange={(text) => handleCueTextChange(cue.id, text)}
                  onTimeChange={(field, val) => handleCueTimeChange(cue.id, field, val)}
                  onDelete={() => handleDeleteCue(cue.id)}
                  onInsertAfter={() => handleInsertCue(cue.index)}
                  onMerge={cue.index < cues.length - 1 ? () => handleMergeCues(cue.id) : undefined}
                  onSplit={
                    cue.text.split(/\s+/).length > 1 ? () => handleSplitCue(cue.id) : undefined
                  }
                  onSetStart={() => handleSetStartFromPlayhead(cue.id)}
                  onSetEnd={() => handleSetEndFromPlayhead(cue.id)}
                  hasAudio={!!audioUrl}
                  t={t}
                />
              ))}

              {/* Add cue button at bottom */}
              <div className="caption-editor-add-row">
                <button
                  type="button"
                  onClick={handleAddCue}
                  className="btn btn-ghost btn-xs gap-1 w-full"
                  disabled={disabled}
                >
                  <PlusIcon className="w-3 h-3" />
                  {t.podcasts.captionAddCue}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Source view ── */
        <div className="caption-editor-source">
          <textarea
            className="textarea textarea-bordered w-full font-mono text-xs leading-relaxed"
            value={sourceText}
            onChange={(e) => handleSourceChange(e.target.value)}
            rows={12}
            disabled={disabled}
            placeholder={t.podcasts.transcriptPlaceholder}
          />
          {sourceText !== value && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleApplySource}
                className="btn btn-primary btn-sm gap-1"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                {t.podcasts.captionApplyChanges}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats footer */}
      {cues.length > 0 && (
        <div className="caption-editor-footer">
          <span>
            {cues.length} {t.podcasts.captionCueCount}
          </span>
          <span>·</span>
          <span>{format.toUpperCase()}</span>
          {cues.length > 0 && (
            <>
              <span>·</span>
              <span>
                {formatTimestampShort(cues[0].startTime)} –{" "}
                {formatTimestampShort(cues[cues.length - 1].endTime)}
              </span>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.srt,.vtt,.md"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}

/* ─────────────────── CueRow sub-component ─────────────────── */

interface CueRowProps {
  cue: CaptionCue;
  isActive: boolean;
  isSelected: boolean;
  disabled: boolean;
  hasAudio: boolean;
  onSelect: () => void;
  onSeek: () => void;
  onTextChange: (text: string) => void;
  onTimeChange: (field: "startTime" | "endTime", value: string) => void;
  onDelete: () => void;
  onInsertAfter: () => void;
  onMerge?: () => void;
  onSplit?: () => void;
  onSetStart: () => void;
  onSetEnd: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

function CueRow({
  cue,
  isActive,
  isSelected,
  disabled,
  hasAudio,
  onSelect,
  onSeek,
  onTextChange,
  onTimeChange,
  onDelete,
  onInsertAfter,
  onMerge,
  onSplit,
  onSetStart,
  onSetEnd,
  t,
}: CueRowProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      data-cue-id={cue.id}
      className={`caption-editor-cue-row ${isActive ? "caption-cue-active" : ""} ${
        isSelected ? "caption-cue-selected" : ""
      }`}
      onClick={onSelect}
    >
      {/* Index */}
      <span className="caption-editor-col-index">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeek();
          }}
          className="caption-cue-index-btn"
          title={t.podcasts.captionSeekTo}
          disabled={!hasAudio}
        >
          {cue.index + 1}
        </button>
      </span>

      {/* Start time */}
      <span className="caption-editor-col-time">
        <input
          type="text"
          className="caption-time-input"
          value={formatTimestampVTT(cue.startTime)}
          onChange={(e) => onTimeChange("startTime", e.target.value)}
          disabled={disabled}
          title={t.podcasts.captionStart}
        />
        {hasAudio && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetStart();
            }}
            className="caption-time-set-btn"
            title={t.podcasts.captionSetFromPlayhead}
          >
            <CursorIcon className="w-2.5 h-2.5" />
          </button>
        )}
      </span>

      {/* End time */}
      <span className="caption-editor-col-time">
        <input
          type="text"
          className="caption-time-input"
          value={formatTimestampVTT(cue.endTime)}
          onChange={(e) => onTimeChange("endTime", e.target.value)}
          disabled={disabled}
          title={t.podcasts.captionEnd}
        />
        {hasAudio && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetEnd();
            }}
            className="caption-time-set-btn"
            title={t.podcasts.captionSetFromPlayhead}
          >
            <CursorIcon className="w-2.5 h-2.5" />
          </button>
        )}
      </span>

      {/* Text */}
      <span className="caption-editor-col-text">
        <textarea
          className="caption-text-input"
          value={cue.text}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={disabled}
          rows={1}
          onInput={(e) => {
            const ta = e.currentTarget;
            ta.style.height = "auto";
            ta.style.height = `${ta.scrollHeight}px`;
          }}
        />
      </span>

      {/* Actions */}
      <span className="caption-editor-col-actions">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="btn btn-ghost btn-xs btn-square"
            disabled={disabled}
          >
            <MoreIcon className="w-3.5 h-3.5" />
          </button>
          {showActions && (
            <div className="caption-cue-actions-menu">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertAfter();
                  setShowActions(false);
                }}
              >
                <PlusIcon className="w-3 h-3" />
                {t.podcasts.captionInsertAfter}
              </button>
              {onSplit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit();
                    setShowActions(false);
                  }}
                >
                  <SplitIcon className="w-3 h-3" />
                  {t.podcasts.captionSplit}
                </button>
              )}
              {onMerge && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMerge();
                    setShowActions(false);
                  }}
                >
                  <MergeIcon className="w-3 h-3" />
                  {t.podcasts.captionMerge}
                </button>
              )}
              <div className="divider my-0.5" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowActions(false);
                }}
                className="text-error"
              >
                <TrashIcon className="w-3 h-3" />
                {t.podcasts.captionDelete}
              </button>
            </div>
          )}
        </div>
      </span>
    </div>
  );
}

/* ─────────────────────────── Icons ─────────────────────────── */

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function TranscriptIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function SplitIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    </svg>
  );
}

function MergeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 3L3 7.5m0 0L7.5 12M3 7.5h13.5m0 13.5L21 16.5m0 0L16.5 12M21 16.5H7.5"
      />
    </svg>
  );
}

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
      />
    </svg>
  );
}
