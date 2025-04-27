"use client";

import type { StickyNote } from "./items";
import { cn } from "@/lib/utils";
import { memo, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import ItemWrapper from "./item-wrapper";

const StickyNote = memo(function StickyNote({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ItemWrapper
      id={id}
      tabClassName="bg-yellow-300"
      className={cn("min-h-52 bg-yellow-200 p-4 text-gray-800", className)}
    >
      {children}
    </ItemWrapper>
  );
});

export default StickyNote;

export function TextSticky({
  id,
  item,
  placeholder,
}: {
  id: string;
  item: StickyNote;
  placeholder?: string;
}) {
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
    <StickyNote id={id}>
      <textarea
        className="max-h-96 min-h-44 min-w-56 resize-none outline-none hover:resize-x"
        placeholder={placeholder ?? "New sticky note..."}
        onChange={(e) => {
          calcHeight();
          debouncedContent(e.target.value);
        }}
        style={{ width: item.width }}
        defaultValue={item.content}
        ref={textareaRef}
      />
    </StickyNote>
  );
}
