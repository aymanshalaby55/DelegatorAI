import type { Components } from "react-markdown";

export function detectPlatform(url: string | null | undefined): string {
  if (!url) return "Unknown";
  if (url.includes("zoom.us")) return "Zoom";
  if (url.includes("meet.google")) return "Google Meet";
  if (url.includes("teams.microsoft")) return "Teams";
  return "Unknown";
}

export const summaryMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-primary mt-4 mb-1.5 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold text-primary/80 mt-3 mb-1 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-foreground mt-2 mb-1 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-muted-foreground leading-relaxed mb-2 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="text-foreground/80">{children}</em>,
  ul: ({ children }) => (
    <ul className="space-y-1 my-2 pl-4 list-none">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1 my-2 pl-4 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-muted-foreground flex gap-2 items-start">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-sm text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-primary">
      {children}
    </code>
  ),
  hr: () => <hr className="border-border my-3" />,
};
