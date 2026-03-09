"use client";

import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import { useCallback, useRef, useState, useEffect } from "react";
import { useTranslation } from "@/components/LanguageProvider";

const lowlight = createLowlight(common);

interface MediumEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function MediumEditor({
  value,
  onChange,
  placeholder,
  onImageUpload,
}: MediumEditorProps) {
  const { t } = useTranslation();
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [bubbleMenuPos, setBubbleMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [floatingMenuPos, setFloatingMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [floatingExpanded, setFloatingExpanded] = useState(false);

  const linkInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const initialContentSet = useRef(false);

  /* ── Refs to keep editorProps closures current ────────────────────── */
  const onImageUploadRef = useRef(onImageUpload);
  useEffect(() => {
    onImageUploadRef.current = onImageUpload;
  }, [onImageUpload]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Holds the latest handleImageFile – updated once the editor instance exists
  const handleImageFileRef = useRef<(file: File, pos?: number) => Promise<void>>(
    async () => undefined
  );

  /* ── Menu positioning helpers (stable – no deps) ──────────────────── */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateBubbleMenu = useCallback((ed: any) => {
    if (!wrapperRef.current) return;
    const { from, to, empty } = ed.state.selection;
    if (empty || from === to) {
      setBubbleMenuPos(null);
      return;
    }
    try {
      const view = ed.view;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      setBubbleMenuPos({
        top: start.top - wrapperRect.top - 50,
        left: (start.left + end.right) / 2 - wrapperRect.left,
      });
    } catch {
      setBubbleMenuPos(null);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFloatingMenu = useCallback((ed: any) => {
    if (!wrapperRef.current) return;
    const { empty, $from } = ed.state.selection;
    const isEmptyTextBlock = empty && $from.parent.isTextblock && $from.parent.content.size === 0;
    if (!isEmptyTextBlock) {
      setFloatingMenuPos(null);
      setFloatingExpanded(false);
      return;
    }
    try {
      const view = ed.view;
      const coords = view.coordsAtPos($from.pos);
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      setFloatingMenuPos({
        top: coords.top - wrapperRect.top - 4,
        left: -40,
      });
    } catch {
      setFloatingMenuPos(null);
    }
  }, []);

  /* ── Editor ───────────────────────────────────────────────────────── */

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        blockquote: {
          HTMLAttributes: { class: "medium-blockquote" },
        },
        horizontalRule: {},
        bulletList: {},
        orderedList: {},
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockNodeView);
        },
      }).configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      Placeholder.configure({
        placeholder: placeholder || t.mediumEditor.placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Image.configure({
        HTMLAttributes: { class: "medium-editor-image" },
        allowBase64: false,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "medium-editor-link",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (ed.storage as any).markdown.getMarkdown();
      onChangeRef.current(md);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      updateBubbleMenu(ed);
      updateFloatingMenu(ed);
    },
    onFocus: ({ editor: ed }) => {
      updateFloatingMenu(ed);
    },
    editorProps: {
      attributes: {
        class: "medium-editor-content",
      },
      handleDrop: (view, event) => {
        if (!event.dataTransfer?.files.length) return false;
        const file = event.dataTransfer.files[0];
        if (file?.type.startsWith("image/") && onImageUploadRef.current) {
          event.preventDefault();
          handleImageFileRef.current(file, view.state.selection.from);
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/") && onImageUploadRef.current) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) handleImageFileRef.current(file, view.state.selection.from);
            return true;
          }
        }
        return false;
      },
    },
    // Suppress SSR hydration mismatch
    immediatelyRender: false,
  });

  /* ── Keep handleImageFile ref current (depends on editor instance) ─ */
  useEffect(() => {
    handleImageFileRef.current = async (file: File, pos?: number) => {
      const upload = onImageUploadRef.current;
      if (!upload || !editor) return;
      try {
        const url = await upload(file);
        if (pos !== undefined) {
          editor
            .chain()
            .focus()
            .insertContentAt(pos, {
              type: "image",
              attrs: { src: url },
            })
            .run();
        } else {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch {
        // silently fail – the upload component shows its own errors
      }
    };
  }, [editor]);

  /* ── Sync external value (e.g. loading a post for editing) ──────── */
  useEffect(() => {
    if (!editor) return;
    if (!initialContentSet.current && value) {
      editor.commands.setContent(value);
      initialContentSet.current = true;
    }
  }, [editor, value]);

  /* ── Close menus when clicking outside the wrapper ─────────────── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as HTMLElement)) {
        setBubbleMenuPos(null);
        setFloatingMenuPos(null);
        setFloatingExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Image helpers ─────────────────────────────────────────────── */

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFileRef.current(file);
      e.target.value = "";
    }
  }, []);

  const addImageByUrl = useCallback(() => {
    if (!editor) return;
    const url = prompt(t.mediumEditor.imageUrlPrompt);
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor, t]);

  /* ── Link helpers ──────────────────────────────────────────────── */

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }
    setShowLinkInput(true);
    setLinkUrl("");
    setTimeout(() => linkInputRef.current?.focus(), 50);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  /* ── Loading state ─────────────────────────────────────────────── */
  if (!editor) {
    return (
      <div className="medium-editor-wrapper">
        <div className="medium-editor-content min-h-[400px]" />
      </div>
    );
  }

  return (
    <div className="medium-editor-wrapper" ref={wrapperRef}>
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Bubble Menu: appears on text selection ── */}
      {bubbleMenuPos && (
        <div
          ref={bubbleRef}
          className="medium-bubble-menu"
          /* Prevent clicks inside the menu from stealing focus / blur */
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: "absolute",
            top: bubbleMenuPos.top,
            left: bubbleMenuPos.left,
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
        >
          {showLinkInput ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                /* Allow the link input itself to receive focus */
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === "Escape") {
                    setShowLinkInput(false);
                  }
                }}
                placeholder="https://..."
                className="bg-transparent text-white text-sm outline-none w-48 px-1"
              />
              <button
                type="button"
                onClick={applyLink}
                className="text-white/80 hover:text-white text-sm px-1"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(false)}
                className="text-white/80 hover:text-white text-sm px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              <BubbleButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title={t.mediumEditor.bold}
              >
                <BoldIcon />
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title={t.mediumEditor.italic}
              >
                <ItalicIcon />
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                title={t.mediumEditor.underline}
              >
                <UnderlineIcon />
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                title={t.mediumEditor.strikethrough}
              >
                <StrikeIcon />
              </BubbleButton>

              <MenuDivider />

              <BubbleButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive("code")}
                title={t.mediumEditor.code}
              >
                <CodeInlineIcon />
              </BubbleButton>
              <BubbleButton
                onClick={toggleLink}
                isActive={editor.isActive("link")}
                title={t.mediumEditor.link}
              >
                <LinkIcon />
              </BubbleButton>

              <MenuDivider />

              <BubbleButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                title={t.mediumEditor.heading2}
              >
                <span className="font-bold text-[11px] leading-none">H2</span>
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive("heading", { level: 3 })}
                title={t.mediumEditor.heading3}
              >
                <span className="font-bold text-[11px] leading-none">H3</span>
              </BubbleButton>

              <MenuDivider />

              <BubbleButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive("blockquote")}
                title={t.mediumEditor.quote}
              >
                <QuoteIcon />
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive("codeBlock")}
                title={t.mediumEditor.codeBlock}
              >
                <CodeBlockIcon />
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                title={t.mediumEditor.bulletList}
              >
                <BulletListIcon />
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                title={t.mediumEditor.orderedList}
              >
                <OrderedListIcon />
              </BubbleButton>

              <MenuDivider />

              <BubbleButton
                onClick={() => {
                  (onImageUpload ? addImage : addImageByUrl)();
                }}
                isActive={false}
                title={t.mediumEditor.image}
              >
                <ImageIcon />
              </BubbleButton>
              <BubbleButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                isActive={false}
                title={t.mediumEditor.divider}
              >
                <DividerIcon />
              </BubbleButton>
            </div>
          )}
        </div>
      )}

      {/* ── Floating Menu: appears on empty lines ── */}
      {floatingMenuPos && (
        <div
          ref={floatingRef}
          className="medium-floating-menu"
          /* Prevent clicks from stealing focus / blur */
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: "absolute",
            top: floatingMenuPos.top,
            left: floatingMenuPos.left,
            zIndex: 40,
          }}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFloatingExpanded(!floatingExpanded)}
              className={`medium-floating-trigger ${floatingExpanded ? "expanded" : ""}`}
              title={t.mediumEditor.addBlock}
            >
              <PlusIcon />
            </button>

            {floatingExpanded && (
              <div className="flex items-center gap-0.5 animate-in slide-in-from-left-2 duration-200">
                <FloatingButton
                  onClick={() => {
                    (onImageUpload ? addImage : addImageByUrl)();
                    setFloatingExpanded(false);
                  }}
                  title={t.mediumEditor.image}
                >
                  <ImageIcon />
                </FloatingButton>
                <FloatingButton
                  onClick={() => {
                    editor.chain().focus().setHorizontalRule().run();
                    setFloatingExpanded(false);
                  }}
                  title={t.mediumEditor.divider}
                >
                  <DividerIcon />
                </FloatingButton>
                <FloatingButton
                  onClick={() => {
                    editor.chain().focus().toggleBlockquote().run();
                    setFloatingExpanded(false);
                  }}
                  title={t.mediumEditor.quote}
                >
                  <QuoteIcon />
                </FloatingButton>
                <FloatingButton
                  onClick={() => {
                    editor.chain().focus().toggleCodeBlock().run();
                    setFloatingExpanded(false);
                  }}
                  title={t.mediumEditor.codeBlock}
                >
                  <CodeBlockIcon />
                </FloatingButton>
                <FloatingButton
                  onClick={() => {
                    editor.chain().focus().toggleBulletList().run();
                    setFloatingExpanded(false);
                  }}
                  title={t.mediumEditor.bulletList}
                >
                  <BulletListIcon />
                </FloatingButton>
                <FloatingButton
                  onClick={() => {
                    editor.chain().focus().toggleOrderedList().run();
                    setFloatingExpanded(false);
                  }}
                  title={t.mediumEditor.orderedList}
                >
                  <OrderedListIcon />
                </FloatingButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Editor Content ── */}
      <EditorContent editor={editor} />
    </div>
  );
}

/* ── Code Block Node View (with language selector) ─────────────────── */

const LANGUAGES = [
  "plaintext",
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "diff",
  "go",
  "graphql",
  "ini",
  "java",
  "javascript",
  "json",
  "kotlin",
  "lua",
  "makefile",
  "markdown",
  "objectivec",
  "perl",
  "php",
  "python",
  "r",
  "ruby",
  "rust",
  "scss",
  "shell",
  "sql",
  "swift",
  "typescript",
  "xml",
  "yaml",
];

function CodeBlockNodeView({ node, updateAttributes }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="medium-code-block-wrapper">
      <select
        contentEditable={false}
        className="medium-code-lang-select"
        value={node.attrs.language || "plaintext"}
        onChange={(e) => updateAttributes({ language: e.target.value })}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
        {/* If the current language isn't in our list, still show it */}
        {node.attrs.language && !LANGUAGES.includes(node.attrs.language) && (
          <option value={node.attrs.language}>{node.attrs.language}</option>
        )}
      </select>
      <pre>
        <NodeViewContent<"code">
          as="code"
          className={node.attrs.language ? `language-${node.attrs.language}` : ""}
        />
      </pre>
    </NodeViewWrapper>
  );
}

/* ── Button components ─────────────────────────────────────────────── */

function BubbleButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`medium-bubble-btn ${isActive ? "is-active" : ""}`}
      title={title}
    >
      {children}
    </button>
  );
}

function FloatingButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="medium-floating-btn" title={title}>
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="w-px h-5 bg-white/20 mx-0.5" />;
}

/* ── Icons (16×16 SVGs) ────────────────────────────────────────────── */

function BoldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5Zm0 2v5h5a2.5 2.5 0 0 0 0-5H8ZM6 4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.5 4.5 0 0 1 13 20H6V4Z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M15 20H7v-2h2.927l2.116-12H10V4h8v2h-2.927l-2.116 12H15v2Z" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M8 3v9a4 4 0 0 0 8 0V3h2v9a6 6 0 0 1-12 0V3h2ZM4 20h16v2H4v-2Z" />
    </svg>
  );
}

function StrikeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.586-1.144V16.6c1.52.877 3.075 1.4 4.586 1.4 2.136 0 3.2-.672 3.2-2.016 0-.398-.107-.745-.32-1.04-.214-.296-.62-.597-1.22-.903H3v-2h18v2h-3.846ZM7.556 9c-.159-.424-.237-.89-.237-1.402 0-1.24.503-2.258 1.508-3.053C9.833 3.848 11.183 3.45 12.88 3.45c1.385 0 2.874.37 4.12 1.1v2.124c-1.342-.696-2.733-1.044-4.17-1.044-2.04 0-3.06.6-3.06 1.8 0 .392.133.738.4 1.04.27.3.774.634 1.51 1.002l.466.226H7.556Z" />
    </svg>
  );
}

function CodeInlineIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="w-5 h-5"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="w-4 h-4"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Z" />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <polyline points="10 8 6 12 10 16" />
      <polyline points="14 8 18 12 14 16" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
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

function OrderedListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
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
