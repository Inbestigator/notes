"use client";
import type { Still, BaseBoardItem, LinedPaper } from "@/app/page";
import { cn } from "@/lib/utils";
import useDrag from "@/lib/hooks/drag";
import { useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function Sheet({
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
      style={{ transform: `translate(${localOffset.x}px, ${localOffset.y}px)` }}
      className={cn(
        "group absolute min-h-96 cursor-default overflow-hidden rounded-sm bg-neutral-50 text-gray-800 shadow-lg transition-none duration-300 ease-in-out [transition:border-radius_150ms_cubic-bezier(0.4,0,0.2,1)] hover:rounded-br-4xl",
        isDragging && "pointer-events-none opacity-90 select-none",
        className,
      )}
    >
      {children}
      <div
        onMouseDown={handleMouseDown}
        className="pointer-events-auto absolute right-0 bottom-0 z-10 size-6 translate-full cursor-grab rounded-tl-sm bg-neutral-200 shadow-md transition-all duration-300 ease-in-out group-hover:translate-0 group-hover:-skew-6 hover:not-active:size-7 hover:not-active:-skew-3 active:cursor-grabbing"
      />
    </div>
  );
}

export function LinedPaper({
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
    <Sheet id={id} offset={item.offset}>
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
            className="pointer-events-none absolute inset-0"
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

export function Still({
  id,
  item,
  placeholderTitle,
}: {
  id: string;
  item: Still;
  placeholderTitle?: string;
}) {
  const debouncedTitle = useDebouncedCallback((title) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { title } },
      }),
    );
  }, 150);

  return (
    <Sheet id={id} className="p-4" offset={item.offset}>
      <img src={item.src} className="size-96 rounded-xs" />
      <input
        type="text"
        className="mt-4 w-full text-xl font-medium outline-none"
        placeholder={placeholderTitle ?? "A photo of..."}
        onChange={(e) => debouncedTitle(e.target.value)}
        defaultValue={item.title}
      />
    </Sheet>
  );
}
