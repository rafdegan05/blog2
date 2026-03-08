"use client";

import { useState, useRef, useCallback } from "react";
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

export default function FileUpload({
  type,
  onUpload,
  value,
  label,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const acceptTypes =
    type === "image"
      ? "image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
      : "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4,audio/x-m4a,audio/webm";

  const maxSizeMB = type === "image" ? 5 : 100;

  const uploadFile = useCallback(
    async (file: File) => {
      setError("");
      setUploading(true);

      try {
        // Client-side size check
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(t.upload.fileTooLarge.replace("{n}", String(maxSizeMB)));
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || t.upload.uploadFailed);
          return;
        }

        const data = await res.json();
        onUpload(data.url);
      } catch {
        setError(t.upload.uploadFailed);
      } finally {
        setUploading(false);
      }
    },
    [type, maxSizeMB, onUpload]
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
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="form-control">
      {label && (
        <label className="label">
          <span className="label-text font-semibold">{label}</span>
        </label>
      )}

      {/* Preview area */}
      {value && type === "image" && (
        <div className="relative mb-2 inline-block">
          <img
            src={value}
            alt={t.upload.preview}
            className="max-h-48 rounded-lg object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-circle btn-error btn-xs absolute top-1 right-1"
            title={t.upload.remove}
          >
            ✕
          </button>
        </div>
      )}

      {value && type === "audio" && (
        <div className="mb-2 flex items-center gap-2">
          <audio controls className="flex-1" src={value}>
            {t.upload.audioNotSupported}
          </audio>
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-circle btn-error btn-xs"
            title={t.upload.remove}
          >
            ✕
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? "border-primary bg-primary/10" : "border-base-300 hover:border-primary/50"}
          ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}
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

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <span className="loading loading-spinner loading-md" />
            <span className="text-sm text-base-content/60">{t.upload.uploading}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-base-content/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm text-base-content/60">
              {value ? t.upload.clickOrDragReplace : t.upload.clickOrDragUpload}
            </span>
            <span className="text-xs text-base-content/40">
              {type === "image"
                ? t.upload.imageTypes.replace("{n}", String(maxSizeMB))
                : t.upload.audioTypes.replace("{n}", String(maxSizeMB))}
            </span>
          </div>
        )}
      </div>

      {/* URL input fallback */}
      <div className="mt-2">
        <label className="label">
          <span className="label-text-alt text-base-content/50">{t.upload.pasteUrl}</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm w-full"
          placeholder={type === "image" ? t.upload.imagePlaceholder : t.upload.audioPlaceholder}
          value={value || ""}
          onChange={(e) => onUpload(e.target.value)}
          disabled={disabled || uploading}
        />
      </div>

      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
}
