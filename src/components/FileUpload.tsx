"use client";

import { useState, useRef, useCallback } from "react";

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
          setError(`File too large. Maximum: ${maxSizeMB} MB`);
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
          setError(data.error || "Upload failed");
          return;
        }

        const data = await res.json();
        onUpload(data.url);
      } catch {
        setError("Upload failed. Please try again.");
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
            alt="Upload preview"
            className="max-h-48 rounded-lg object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-circle btn-error btn-xs absolute top-1 right-1"
            title="Remove"
          >
            ✕
          </button>
        </div>
      )}

      {value && type === "audio" && (
        <div className="mb-2 flex items-center gap-2">
          <audio controls className="flex-1" src={value}>
            Your browser does not support the audio element.
          </audio>
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-circle btn-error btn-xs"
            title="Remove"
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
            <span className="text-sm text-base-content/60">Uploading...</span>
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
              {value ? "Click or drag to replace" : "Click or drag to upload"}
            </span>
            <span className="text-xs text-base-content/40">
              {type === "image"
                ? `JPEG, PNG, GIF, WebP, SVG — max ${maxSizeMB} MB`
                : `MP3, WAV, OGG, AAC, M4A — max ${maxSizeMB} MB`}
            </span>
          </div>
        )}
      </div>

      {/* URL input fallback */}
      <div className="mt-2">
        <label className="label">
          <span className="label-text-alt text-base-content/50">Or paste a URL directly</span>
        </label>
        <input
          type="url"
          className="input input-bordered input-sm w-full"
          placeholder={
            type === "image" ? "https://example.com/image.jpg" : "https://example.com/audio.mp3"
          }
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
