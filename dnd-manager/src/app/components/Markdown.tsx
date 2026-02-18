"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content?: string | null;
  className?: string;
};

function isMarkdownLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    /^#{1,6}\s/.test(trimmed) ||
    /^[-*+]\s/.test(trimmed) ||
    /^\d+\.\s/.test(trimmed) ||
    /^>\s/.test(trimmed) ||
    /^`{3,}/.test(trimmed) ||
    /^\|/.test(trimmed)
  );
}

function isPlainSectionTitle(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 64) return false;
  if (/[.!?;:]$/.test(trimmed)) return false;
  if (/[`*_#[\]<>|]/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 7) return false;
  return words.every((word) =>
    /^[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9'()/-]*$/.test(word)
  );
}

function promotePlainSectionTitles(input: string): string {
  const normalized = input.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const next = [...lines];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();
    const previousHasContent = i > 0 && (lines[i - 1] ?? "").trim().length > 0;
    const followingHasContent = i < lines.length - 1 && (lines[i + 1] ?? "").trim().length > 0;

    if (
      !previousHasContent &&
      followingHasContent &&
      !isMarkdownLine(trimmed) &&
      isPlainSectionTitle(trimmed)
    ) {
      next[i] = `### ${trimmed}`;
    }
  }

  return next.join("\n");
}

export function Markdown({ content, className }: MarkdownProps) {
  if (!content || !content.trim()) return null;
  const normalizedContent = promotePlainSectionTitles(content);
  const highlightedDiceContent = normalizedContent.replace(
    /\b\d*d\d+\b/gi,
    (match) => `**${match}**`
  );

  return (
    <div
      className={`markdown text-sm leading-relaxed break-words [overflow-wrap:anywhere] [&_strong]:text-accent-strong [&_strong]:font-semibold ${className ?? ""}`.trim()}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {highlightedDiceContent}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;
