"use client";

import type { BaseItem } from "@/components/items";
import { cn } from "@/lib/utils";
import { StickyNoteIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { Plugin } from ".";
import ItemWrapper from "@/components/item-wrapper";
import useUpdateItem from "@/lib/hooks/useUpdateItem";

interface StickyNote extends BaseItem {
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
  const setItem = useUpdateItem(id);
  const debouncedContent = useDebouncedCallback((content) => {
    setItem({ content });
  }, 150);
  const debouncedResize = useDebouncedCallback((width) => {
    setItem({ width });
  }, 150);

  const [localWidth, setLocalWidth] = useState(item.width);
  const [isResizing, setIsResizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  function calcHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = localWidth || textareaRef.current?.offsetWidth || 256;
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      const deltaX = e.clientX - startX.current;
      const newWidth = Math.max(224, startWidth.current + deltaX);
      setLocalWidth(newWidth);
    }

    function handleMouseUp() {
      if (isResizing) {
        setIsResizing(false);
        debouncedResize(localWidth);
      }
    }
    calcHeight();

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, localWidth, debouncedResize]);

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
        className="max-h-96 min-h-44 min-w-56 resize-none outline-none"
        placeholder="New sticky note..."
        onChange={(e) => {
          calcHeight();
          debouncedContent(e.target.value);
        }}
        style={{ width: localWidth }}
        defaultValue={item.content}
        ref={textareaRef}
      />
      <div
        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize"
        onMouseDown={handleMouseDown}
      />
    </ItemWrapper>
  );
}
