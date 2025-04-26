"use client";
import type { StickyNote, BaseBoardItem } from "@/app/page";
import { cn } from "@/lib/utils";
import { memo, useEffect, useRef } from "react";
import useDrag from "@/lib/hooks/drag";
import { useDebouncedCallback } from "use-debounce";

const StickyNote = memo(function StickyNote({
  id,
  children,
  className,
  offset = { x: 0, y: 0 },
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  offset?: BaseBoardItem["offset"];
}) {
  const { isDragging, localOffset, handleMouseDown } = useDrag(id, offset);

  return (
    <div
      style={{
        transform: `translate(${localOffset.x}px, ${localOffset.y}px)`,
      }}
      className={cn(
        "group absolute min-h-52 cursor-default overflow-hidden rounded-sm bg-yellow-200 p-4 text-gray-800 shadow-lg transition-none duration-300 ease-in-out [transition:border-radius_150ms_cubic-bezier(0.4,0,0.2,1)] hover:rounded-br-4xl",
        isDragging && "pointer-events-none opacity-90",
        className,
      )}
    >
      {children}
      <div
        onMouseDown={handleMouseDown}
        className="pointer-events-auto absolute right-0 bottom-0 z-10 size-6 translate-full cursor-grab rounded-tl-sm bg-yellow-300 shadow-md transition-all duration-300 ease-in-out group-hover:translate-0 group-hover:-skew-6 hover:not-active:size-7 hover:not-active:-skew-3 active:cursor-grabbing"
      />
    </div>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StickyNote id={id} offset={item.offset}>
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
