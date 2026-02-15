"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content?: string | null;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  if (!content || !content.trim()) return null;
  const highlightedDiceContent = content.replace(
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
