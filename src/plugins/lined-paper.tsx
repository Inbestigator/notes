"use client";

import type { BaseItem } from "@/components/items";
import { NotebookText } from "lucide-react";
import type { Plugin } from ".";
import Sheet from "@/components/primitives/paper";
import { useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

interface LinedPaper extends BaseItem {
  type: "lined-paper";
  title: string;
  content: string;
}

export default {
  name: "lined-paper",
  displayName: "Lined Paper",
  isRequired: true,
  defaultProps: { title: "", content: "" },
  dimensions: { width: 608, height: 680 },
  HudComponent: () => <NotebookText className="size-5" />,
  RenderedComponent,
} as Plugin<LinedPaper>;

function RenderedComponent({ id, item }: { id: string; item: LinedPaper }) {
  const debouncedDetails = useDebouncedCallback((title, content) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { title, content } },
      }),
    );
  }, 150);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function calcHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }

  useEffect(calcHeight, []);

  return (
    <Sheet id={id}>
      <article className="inset-0 m-4 mt-6 h-160 w-xl overflow-scroll">
        <input
          type="text"
          style={{
            backgroundPositionY: "calc(1lh - 6px)",
            backgroundSize: "100% 1lh",
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0, transparent calc(1lh - 1px), oklch(70.4% 0.191 22.216) 1lh)",
          }}
          className="sticky top-0 z-10 w-full border-none border-red-400 bg-neutral-50 text-xl font-medium outline-none"
          onChange={(e) => debouncedDetails(e.target.value, item.content)}
          defaultValue={item.title}
        />
        <div className="relative h-fit">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundPositionY: "calc(1lh - 6px)",
              backgroundSize: "100% 1lh",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0, transparent calc(1lh - 1px), oklch(80.9% 0.105 251.813) 1lh)",
            }}
          />
          <textarea
            className="min-h-150 w-full resize-none text-base outline-none"
            onChange={(e) => {
              debouncedDetails(item.title, e.target.value);
              calcHeight();
            }}
            defaultValue={item.content}
            ref={textareaRef}
          />
        </div>
      </article>
    </Sheet>
  );
}
