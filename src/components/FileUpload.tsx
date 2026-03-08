"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useTranslation } from "@/components/LanguageProvider";

interface FileUploadProps {
  /** "image" or "audio" */
  type: "image" | "audio";
  /** Called with the uploaded file URL */
  onUpload: (url: string) => void;
  /** Current value (URL) */
  value?: string;
  /** Label to show */
  label?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function AudioIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  );
}

export default function FileUpload({
  type,
  onUpload,
  value,
  label,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const { t } = useTranslation();

  const acceptTypes =
    type === "image"
      ? "image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
      : "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4,audio/x-m4a,audio/webm";

  const maxSizeMB = type === "image" ? 5 : 100;

  const uploadFile = useCallback(
    (file: File) => {
      setError("");

      // Client-side size check
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(t.upload.fileTooLarge.replace("{n}", String(maxSizeMB)));
        return;
      }

      setUploading(true);
      setProgress(0);
      setFileName(file.name);
      setFileSize(file.size);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        xhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            onUpload(data.url);
          } catch {
            setError(t.upload.uploadFailed);
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error || t.upload.uploadFailed);
          } catch {
            setError(t.upload.uploadFailed);
          }
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        xhrRef.current = null;
        setError(t.upload.uploadFailed);
      });

      xhr.addEventListener("abort", () => {
        setUploading(false);
        xhrRef.current = null;
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    },
    [type, maxSizeMB, onUpload, t]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    onUpload("");
    setFileName("");
    setFileSize(0);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  return (
    <div className="form-control">
      {label && (
        <label className="label">
          <span className="label-text font-semibold">{label}</span>
        </label>
      )}

      {/* ── Image preview ── */}
      {value && type === "image" && !uploading && (
        <div className="relative mb-3 rounded-xl overflow-hidden bg-base-200 border border-base-300 group">
          <div className="relative w-full h-56">
            <Image
              src={value}
              alt={t.upload.preview}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized={value.startsWith("/uploads/")}
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) inputRef.current?.click();
                }}
                className="btn btn-sm bg-white/80 hover:bg-white text-base-content border-0"
                title={t.upload.clickOrDragReplace}
              >
                <ImageIcon className="h-4 w-4" />
                {t.upload.replace}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="btn btn-sm btn-error"
                title={t.upload.remove}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
          {/* File info bar */}
          {fileName && (
            <div className="absolute bottom-0 left-0 right-0 bg-base-100/90 backdrop-blur-sm px-3 py-1.5 text-xs flex justify-between items-center">
              <span className="truncate font-medium">{fileName}</span>
              <span className="text-base-content/60 ml-2 whitespace-nowrap">
                {formatFileSize(fileSize)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Audio preview ── */}
      {value && type === "audio" && !uploading && (
        <div className="mb-3 rounded-xl overflow-hidden bg-base-200 border border-base-300 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AudioIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {fileName && <p className="text-sm font-medium truncate">{fileName}</p>}
              {fileSize > 0 && (
                <p className="text-xs text-base-content/50">{formatFileSize(fileSize)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="btn btn-sm btn-ghost btn-circle text-error"
              title={t.upload.remove}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <audio controls className="w-full h-10" src={value}>
            {t.upload.audioNotSupported}
          </audio>
        </div>
      )}

      {/* ── Upload progress ── */}
      {uploading && (
        <div className="mb-3 rounded-xl bg-base-200 border border-base-300 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="loading loading-spinner loading-sm text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-base-content/50">{formatFileSize(fileSize)}</p>
            </div>
            <button
              type="button"
              onClick={handleCancelUpload}
              className="btn btn-xs btn-ghost text-error"
              title={t.upload.cancel}
            >
              {t.upload.cancel}
            </button>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-base-content/50 mt-1 text-right">{progress}%</p>
        </div>
      )}

      {/* ── Drop zone ── */}
      {!uploading && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl text-center cursor-pointer
            transition-all duration-200
            ${
              dragActive
                ? "border-primary bg-primary/10 scale-[1.01] shadow-lg"
                : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${value ? "p-4" : "p-8"}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || uploading}
          />

          <div className="flex flex-col items-center gap-2">
            <div
              className={`rounded-full bg-primary/10 flex items-center justify-center ${value ? "w-8 h-8" : "w-12 h-12"}`}
            >
              {type === "image" ? (
                <ImageIcon className={`text-primary ${value ? "h-4 w-4" : "h-6 w-6"}`} />
              ) : (
                <AudioIcon className={`text-primary ${value ? "h-4 w-4" : "h-6 w-6"}`} />
              )}
            </div>
            <div>
              <p className={`font-medium ${value ? "text-sm" : ""}`}>
                {value ? t.upload.clickOrDragReplace : t.upload.clickOrDragUpload}
              </p>
              <p className={`text-base-content/50 mt-0.5 ${value ? "text-xs" : "text-sm"}`}>
                {type === "image"
                  ? t.upload.imageTypes.replace("{n}", String(maxSizeMB))
                  : t.upload.audioTypes.replace("{n}", String(maxSizeMB))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── URL input fallback (collapsible) ── */}
      <div className="mt-2">
        <button
          type="button"
          className="text-xs text-base-content/50 hover:text-base-content/70 transition-colors flex items-center gap-1"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 transition-transform ${showUrlInput ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          {t.upload.pasteUrl}
        </button>
        {showUrlInput && (
          <input
            type="text"
            className="input input-bordered input-sm w-full mt-1"
            placeholder={type === "image" ? t.upload.imagePlaceholder : t.upload.audioPlaceholder}
            value={value || ""}
            onChange={(e) => onUpload(e.target.value)}
            disabled={disabled || uploading}
          />
        )}
      </div>

      {/* ── Error display ── */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-error text-sm bg-error/10 rounded-lg px-3 py-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError("")} className="btn btn-xs btn-ghost">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
