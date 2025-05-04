"use client";

import type { BaseItem } from "@/components/items";
import type { Plugin } from ".";
import { Heading1, Heading2, Heading3 } from "lucide-react";
import { cn } from "@/lib/utils";
import ItemWrapper from "@/components/item-wrapper";
import { useDebouncedCallback } from "use-debounce";
import useUpdateItem from "@/lib/hooks/useUpdateItem";
import { useEffect, useRef, useState } from "react";

interface Header extends BaseItem {
  content: string;
}

export default {
  name: "header",
  displayName: "Header",
  numVariants: 3,
  dimensions: (variant) => ({
    width: variant === 1 ? 704.667 : variant === 2 ? 433.667 : 295,
    height: variant === 1 ? 74 : variant === 2 ? 52 : 44,
  }),
  HudComponent: ({ variant }) =>
    variant === 1 ? (
      <Heading1 className="size-5" />
    ) : variant === 2 ? (
      <Heading2 className="size-5" />
    ) : (
      <Heading3 className="size-5" />
    ),
  RenderedComponent,
} as Plugin<Header>;

function RenderedComponent({ id, item }: { id: string; item: Header }) {
  const setItem = useUpdateItem(id);
  const debouncedContent = useDebouncedCallback((content) => {
    setItem({ content });
  }, 150);

  const [content, setContent] = useState(item.content ?? "");
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function calcWidth() {
    if (inputRef.current && spanRef.current) {
      const width = spanRef.current.offsetWidth;
      inputRef.current.style.width = `${width}px`;
    }
  }

  useEffect(calcWidth, [content]);
  useEffect(() => {
    setTimeout(calcWidth, 10);
  }, []);

  return (
    <ItemWrapper
      tabClassName="bg-neutral-100"
      className={cn(
        "shadow-none",
        item.variant === 2
          ? "text-3xl font-semibold"
          : item.variant === 3
            ? "text-xl font-medium"
            : "text-5xl font-bold",
      )}
      id={id}
    >
      <input
        ref={inputRef}
        type="text"
        className="absolute top-0 left-0 bg-transparent outline-none"
        placeholder="New header..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          calcWidth();
          debouncedContent(e.target.value);
        }}
      />
      <input
        type="text"
        className="pointer-events-none invisible w-0"
        disabled
      />
      <span ref={spanRef} className="invisible whitespace-pre">
        {content || "New header..."}
      </span>
    </ItemWrapper>
  );
}
