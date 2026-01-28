"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content?: string | null;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  if (!content || !content.trim()) return null;

  return (
    <div className={`markdown text-sm leading-relaxed ${className ?? ""}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export default Markdown;
