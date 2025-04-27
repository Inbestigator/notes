"use client";

import type { LinedPaper } from "../items";
import { useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import Sheet from "./paper";

export default function LinedPaper({
  id,
  item,
  placeholderTitle,
  placeholderContent,
}: {
  id: string;
  item: LinedPaper;
  placeholderTitle?: string;
  placeholderContent?: string;
}) {
  const debouncedDetails = useDebouncedCallback((title, content) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { title, content } },
      }),
    );
  }, 150);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Sheet id={id}>
      <article className="inset-0 m-4 mt-6 h-160 w-xl overflow-scroll">
        <input
          type="text"
          className="sticky -top-2 z-10 mb-2 w-full border-b border-red-400 bg-neutral-50 text-xl font-medium outline-none"
          placeholder={placeholderTitle}
          onChange={(e) => debouncedDetails(e.target.value, item.content)}
          defaultValue={item.title}
        />
        <div className="relative h-fit">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundPositionY: "calc(1lh - 2px)",
              backgroundSize: "100% 1lh",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0, transparent calc(1lh - 1px), oklch(80.9% 0.105 251.813) calc(1lh - 1px), oklch(80.9% 0.105 251.813) 1lh)",
            }}
          />
          <textarea
            className="min-h-150 w-full resize-none outline-none"
            placeholder={placeholderContent}
            style={{
              backgroundPositionY: "calc(1lh - 2px)",
              backgroundSize: "100% 1lh",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0, transparent calc(1lh - 1px), oklch(80.9% 0.105 251.813) calc(1lh - 1px), oklch(80.9% 0.105 251.813) 1lh)",
            }}
            onChange={(e) => {
              debouncedDetails(item.title, e.target.value);
              if (textareaRef.current)
                textareaRef.current.style.height = "auto";
              if (textareaRef.current)
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }}
            defaultValue={item.content}
            ref={textareaRef}
          />
        </div>
      </article>
    </Sheet>
  );
}
