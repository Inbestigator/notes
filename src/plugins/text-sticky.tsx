"use client";

import type { BaseItem } from "@/components/items";
import { cn } from "@/lib/utils";
import { StickyNoteIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { Plugin } from ".";
import ItemWrapper from "@/components/item-wrapper";

interface StickyNote extends BaseItem {
  type: "sticky";
  content: string;
  width: number;
}

export default {
  name: "text-sticky",
  displayName: "Sticky Note",
  isRequired: true,
  numVariants: 3,
  defaultProps: { content: "", width: 0 },
  dimensions: { width: 256, height: 210.5 },
  HudComponent: ({ variant }) => (
    <StickyNoteIcon
      className={cn(
        "size-5",
        variant === 2 && "fill-red-200",
        variant === 3 && "fill-green-200",
      )}
    />
  ),
  RenderedComponent,
} as Plugin<StickyNote>;

function RenderedComponent({ id, item }: { id: string; item: StickyNote }) {
  const debouncedContent = useDebouncedCallback((content) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { content } },
      }),
    );
  }, 150);
  const debouncedResize = useDebouncedCallback((width) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { width } },
      }),
    );
  }, 150);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function calcHeight() {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (textareaRef.current)
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }

  useEffect(() => {
    new ResizeObserver(() => {
      if (!textareaRef.current) return;
      calcHeight();
      debouncedResize(textareaRef.current.offsetWidth);
    }).observe(textareaRef.current!);
  }, [debouncedResize]);

  return (
    <ItemWrapper
      id={id}
      tabClassName={cn(
        "bg-yellow-300",
        item.variant === 2 && "bg-red-300",
        item.variant === 3 && "bg-green-300",
      )}
      className={cn(
        "min-h-52 bg-yellow-200 p-4 text-gray-800",
        item.variant === 2 && "bg-red-200",
        item.variant === 3 && "bg-green-200",
      )}
    >
      <textarea
        className="max-h-96 min-h-44 min-w-56 resize-none outline-none hover:resize-x"
        placeholder="New sticky note..."
        onChange={(e) => {
          calcHeight();
          debouncedContent(e.target.value);
        }}
        style={{ width: item.width }}
        defaultValue={item.content}
        ref={textareaRef}
      />
    </ItemWrapper>
  );
}
