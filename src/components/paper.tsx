"use client";
import { type BoardItem } from "@/app/page";
import { cn } from "@/lib/utils";
import useDrag from "@/lib/hooks/drag";
import { useEffect, useRef, useState } from "react";

export default function Sheet({
  children,
  className,
  offset = { x: 0, y: 0 },
  setOffset,
}: {
  children: React.ReactNode;
  className?: string;
  offset?: BoardItem["offset"];
  setOffset?: (offset: BoardItem["offset"]) => void;
}) {
  const { isDragging, localOffset, handleMouseDown } = useDrag(
    offset,
    setOffset,
  );

  return (
    <div
      style={{ transform: `translate(${localOffset.x}px, ${localOffset.y}px)` }}
      className={cn(
        "group absolute min-h-96 min-w-xl cursor-default overflow-hidden rounded-sm bg-neutral-50 text-gray-800 shadow-lg transition-none duration-300 ease-in-out [transition:border-radius_150ms_cubic-bezier(0.4,0,0.2,1)] hover:rounded-br-4xl",
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
  title,
  content,
  offset,
  setOffset,
}: {
  title?: string;
  content?: string;
  offset?: BoardItem["offset"];
  setOffset?: (offset: BoardItem["offset"]) => void;
}) {
  const [titleValue, setTitleValue] = useState(title ?? "");
  const [contentValue, setContentValue] = useState(content ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (textareaRef.current)
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [contentValue]);

  return (
    <Sheet offset={offset} setOffset={setOffset}>
      <article className="inset-0 m-4 mt-6 h-160 w-xl overflow-scroll">
        <input
          type="text"
          className="sticky -top-2 z-10 mb-2 w-full border-b border-red-400 bg-neutral-50 text-lg font-medium outline-none"
          onChange={(e) => setTitleValue(e.target.value)}
          value={titleValue}
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
            style={{
              backgroundPositionY: "calc(1lh - 2px)",
              backgroundSize: "100% 1lh",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0, transparent calc(1lh - 1px), oklch(80.9% 0.105 251.813) calc(1lh - 1px), oklch(80.9% 0.105 251.813) 1lh)",
            }}
            onChange={(e) => setContentValue(e.target.value)}
            value={contentValue}
            ref={textareaRef}
          />
        </div>
      </article>
    </Sheet>
  );
}
