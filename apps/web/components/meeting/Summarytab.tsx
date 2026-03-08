"use client";

import { useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { useGenerateSummary } from "@/hooks/useMeeting";
import type { Meeting, SummaryFormat, SummaryLength } from "@/types/meeting";

interface SummaryTabProps {
  meeting: Meeting;
}

// Custom markdown components for better styling
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="flex items-center gap-2 text-lg font-bold mt-8 mb-4 pb-2 border-b border-border first:mt-0">
      <span className="text-primary">•</span>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-6 mb-3 text-primary">
      {children}
    </h3>
  ),
  ul: ({ children }) => (
    <ul className="my-3 space-y-2 list-none">{children}</ul>
  ),
  li: ({ children, ...props }) => {
    // Check if this is a nested list item
    const isNested = (props.node?.position?.start?.column ?? 0) > 1;
    return (
      <li
        className={
          isNested
            ? "ml-6 text-sm text-muted-foreground leading-relaxed flex items-start gap-2 before:content-['◦'] before:text-muted-foreground/60 before:mt-1"
            : "leading-relaxed flex items-start gap-2 before:content-['•'] before:text-primary before:font-bold before:mt-1"
        }
      >
        <span>{children}</span>
      </li>
    );
  },
  p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-primary">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-muted-foreground">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground bg-primary/5 rounded-r">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  ),
};

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly T[];
  value: T;
  // eslint-disable-next-line no-unused-vars
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          disabled={disabled}
          className={`px-3 py-1.5 capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            value === opt
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function TypingCursor() {
  return (
    <span className="inline-block w-0.5 h-4 bg-primary align-middle ml-0.5 animate-pulse" />
  );
}

export function SummaryTab({ meeting }: SummaryTabProps) {
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("medium");
  const [summaryFormat, setSummaryFormat] = useState<SummaryFormat>("bullets");

  const { generate, reset, streamedText, isStreaming } = useGenerateSummary(
    meeting.id,
  );

  const handleGenerate = () => {
    generate(summaryLength, summaryFormat);
  };

  const handleRegenerate = () => {
    reset();
    generate(summaryLength, summaryFormat);
  };

  // What text to display: prefer live stream if active, then streamed result,
  // then the persisted summary from the DB
  const displayText = streamedText || meeting.summary;
  const showContent = isStreaming || !!displayText;

  return (
    <div className="glass rounded-2xl p-5">
      {!showContent ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-16 space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground">
              No summary yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Generate an AI-powered summary of this meeting&apos;s transcript.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ToggleGroup
              options={["short", "medium", "detailed"] as const}
              value={summaryLength}
              onChange={setSummaryLength}
              disabled={isStreaming}
            />
            <ToggleGroup
              options={["bullets", "paragraph"] as const}
              value={summaryFormat}
              onChange={setSummaryFormat}
              disabled={isStreaming}
            />
          </div>

          <Button
            className="gap-2 mt-2"
            onClick={handleGenerate}
            disabled={isStreaming}
          >
            <Sparkles className="h-4 w-4" />
            {isStreaming ? "Generating…" : "Generate Summary"}
          </Button>
        </div>
      ) : (
        /* ── Summary content (streaming or persisted) ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Summary
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {!isStreaming && (
                <>
                  <ToggleGroup
                    options={["short", "medium", "detailed"] as const}
                    value={summaryLength}
                    onChange={setSummaryLength}
                  />
                  <ToggleGroup
                    options={["bullets", "paragraph"] as const}
                    value={summaryFormat}
                    onChange={setSummaryFormat}
                  />
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-border"
                onClick={handleRegenerate}
                disabled={isStreaming}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {isStreaming ? "Generating…" : "Regenerate"}
              </Button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {displayText}
            </ReactMarkdown>
            {isStreaming && <TypingCursor />}
          </div>
        </div>
      )}
    </div>
  );
}
