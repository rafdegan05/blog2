"use client";

import { useCallback, useRef, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useTranslation } from "@/components/LanguageProvider";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  id?: string;
  /** Compact mode — smaller toolbar, fewer rows (for comments) */
  compact?: boolean;
}

type FormatAction = {
  key: string;
  icon: React.ReactNode;
  label: string;
  wrap?: [string, string];
  prefix?: string;
};

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 15,
  required,
  id,
  compact = false,
}: MarkdownEditorProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const applyFormat = useCallback(
    (wrap?: [string, string], prefix?: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.substring(start, end);

      let newValue: string;
      let cursorPos: number;

      if (wrap) {
        const [before, after] = wrap;
        newValue = value.substring(0, start) + before + selected + after + value.substring(end);
        cursorPos =
          selected.length > 0
            ? start + before.length + selected.length + after.length
            : start + before.length;
      } else if (prefix) {
        // Line prefix — apply at the start of the current line
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
        cursorPos = start + prefix.length;
      } else {
        return;
      }

      onChange(newValue);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        applyFormat(["**", "**"]);
      } else if (key === "i") {
        e.preventDefault();
        applyFormat(["_", "_"]);
      } else if (key === "k") {
        e.preventDefault();
        applyFormat(["[", "](url)"]);
      } else if (key === "e") {
        e.preventDefault();
        applyFormat(["`", "`"]);
      }
    },
    [applyFormat]
  );

  const actions: FormatAction[] = compact
    ? [
        { key: "bold", icon: <BoldIcon />, label: t.markdown.bold, wrap: ["**", "**"] },
        { key: "italic", icon: <ItalicIcon />, label: t.markdown.italic, wrap: ["_", "_"] },
        { key: "code", icon: <CodeIcon />, label: t.markdown.code, wrap: ["`", "`"] },
        { key: "link", icon: <LinkIcon />, label: t.markdown.link, wrap: ["[", "](url)"] },
      ]
    : [
        { key: "bold", icon: <BoldIcon />, label: t.markdown.bold, wrap: ["**", "**"] },
        { key: "italic", icon: <ItalicIcon />, label: t.markdown.italic, wrap: ["_", "_"] },
        {
          key: "strikethrough",
          icon: <StrikeIcon />,
          label: t.markdown.strikethrough,
          wrap: ["~~", "~~"],
        },
        { key: "sep1", icon: null, label: "" },
        {
          key: "h2",
          icon: <span className="font-bold text-xs">H2</span>,
          label: t.markdown.heading2,
          prefix: "## ",
        },
        {
          key: "h3",
          icon: <span className="font-bold text-xs">H3</span>,
          label: t.markdown.heading3,
          prefix: "### ",
        },
        { key: "sep2", icon: null, label: "" },
        { key: "code", icon: <CodeIcon />, label: t.markdown.code, wrap: ["`", "`"] },
        {
          key: "codeblock",
          icon: <CodeBlockIcon />,
          label: t.markdown.codeBlock,
          wrap: ["```\n", "\n```"],
        },
        { key: "quote", icon: <QuoteIcon />, label: t.markdown.quote, prefix: "> " },
        { key: "sep3", icon: null, label: "" },
        { key: "ul", icon: <UlIcon />, label: t.markdown.bulletList, prefix: "- " },
        { key: "ol", icon: <OlIcon />, label: t.markdown.numberedList, prefix: "1. " },
        { key: "sep4", icon: null, label: "" },
        { key: "link", icon: <LinkIcon />, label: t.markdown.link, wrap: ["[", "](url)"] },
        { key: "image", icon: <ImageIcon />, label: t.markdown.image, wrap: ["![alt](", ")"] },
        { key: "hr", icon: <HrIcon />, label: t.markdown.horizontalRule, prefix: "\n---\n" },
      ];

  return (
    <div className="border border-base-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-base-200 border-b border-base-300 flex-wrap">
        {actions.map((action) =>
          action.icon === null ? (
            <div key={action.key} className="w-px h-5 bg-base-300 mx-1" />
          ) : (
            <button
              key={action.key}
              type="button"
              className="btn btn-ghost btn-xs btn-square tooltip tooltip-bottom"
              data-tip={action.label}
              onClick={() => applyFormat(action.wrap, action.prefix)}
              tabIndex={-1}
            >
              {action.icon}
            </button>
          )
        )}

        {/* Spacer + Preview toggle */}
        <div className="flex-1" />
        <button
          type="button"
          className={`btn btn-ghost btn-xs gap-1 ${showPreview ? "btn-active" : ""}`}
          onClick={() => setShowPreview(!showPreview)}
        >
          <EyeIcon />
          <span className="hidden sm:inline text-xs">{t.markdown.preview}</span>
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className={`p-4 bg-base-100 ${compact ? "min-h-[6rem]" : "min-h-[20rem]"}`}>
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-base-content/40 italic">{t.markdown.emptyPreview}</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={id}
          className="w-full bg-base-100 p-4 font-mono text-sm resize-y focus:outline-none"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={compact ? Math.min(rows, 4) : rows}
          required={required}
        />
      )}
    </div>
  );
}

/* ── Toolbar Icons (14×14 inline SVGs) ── */

function BoldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5Zm0 2v5h5a2.5 2.5 0 0 0 0-5H8ZM6 4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.5 4.5 0 0 1 13 20H6V4Z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M15 20H7v-2h2.927l2.116-12H10V4h8v2h-2.927l-2.116 12H15v2Z" />
    </svg>
  );
}

function StrikeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.586-1.144V16.6c1.52.877 3.075 1.4 4.586 1.4 2.136 0 3.2-.672 3.2-2.016 0-.398-.107-.745-.32-1.04-.214-.296-.62-.597-1.22-.903H3v-2h18v2h-3.846ZM7.556 9c-.159-.424-.237-.89-.237-1.402 0-1.24.503-2.258 1.508-3.053C9.833 3.848 11.183 3.45 12.88 3.45c1.385 0 2.874.37 4.12 1.1v2.124c-1.342-.696-2.733-1.044-4.17-1.044-2.04 0-3.06.6-3.06 1.8 0 .392.133.738.4 1.04.27.3.774.634 1.51 1.002l.466.226H7.556Z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <polyline points="10 8 6 12 10 16" />
      <polyline points="14 8 18 12 14 16" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Z" />
    </svg>
  );
}

function UlIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function OlIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">
        1
      </text>
      <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">
        2
      </text>
      <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">
        3
      </text>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function HrIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="w-3.5 h-3.5"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
