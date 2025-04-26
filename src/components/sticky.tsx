"use client";
import { type BoardItem } from "@/app/page";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import useDrag from "@/lib/hooks/drag";

export default function StickyNote({
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
        "group absolute min-h-52 max-w-xs cursor-default overflow-hidden rounded-sm bg-yellow-200 p-4 text-gray-800 shadow-lg transition-none duration-300 ease-in-out [transition:border-radius_150ms_cubic-bezier(0.4,0,0.2,1)] hover:rounded-br-4xl",
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
}

export function TextSticky({
  content,
  placeholder,
  offset,
  setOffset,
}: {
  content?: string;
  placeholder?: string;
  offset?: BoardItem["offset"];
  setOffset?: (offset: BoardItem["offset"]) => void;
}) {
  const [value, setValue] = useState(content ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (textareaRef.current)
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  return (
    <StickyNote offset={offset} setOffset={setOffset} className="px-0">
      <textarea
        className="max-h-96 min-h-44 w-64 resize-none px-4 outline-none"
        placeholder={placeholder ?? "New sticky note..."}
        onChange={(e) => setValue(e.target.value)}
        value={value}
        ref={textareaRef}
      />
    </StickyNote>
  );
}
