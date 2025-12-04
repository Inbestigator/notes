"use client";

import { Heading1, Heading2, Heading3 } from "lucide-react";
import { useEffect, useRef } from "react";
import ItemWrapper from "@/components/item-wrapper";
import type { BaseItem } from "@/components/items";
import useDebouncedUpdate from "@/lib/hooks/useDebouncedUpdate";
import { cn } from "@/lib/utils";
import type { Plugin } from ".";

interface Header extends BaseItem {
  content: string;
}

export default {
  name: "header",
  displayName: "Header",
  description: "Adds h1, h2, and h3",
  numVariants: 3,
  defaultProps: { content: "" },
  dimensions: (variant) => ({
    width: variant === 1 ? 313 : variant === 2 ? 196 : 125,
    height: variant === 1 ? 61 : variant === 2 ? 39 : 28,
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
} satisfies Plugin<Header>;

function RenderedComponent({ id, item }: { id: string; item: Header }) {
  const [latestItemValue, updateItem] = useDebouncedUpdate(item.id, item);
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!spanRef.current || !inputRef.current) return;
    const observer = new ResizeObserver(() => {
      if (inputRef.current && spanRef.current) {
        inputRef.current.style.width = `${spanRef.current.offsetWidth}px`;
      }
    });
    observer.observe(spanRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <ItemWrapper
      tabClassName="bg-neutral-100"
      className={cn(
        "shadow-none",
        item.variant === 2
          ? "font-semibold text-3xl"
          : item.variant === 3
            ? "font-medium text-xl"
            : "font-bold text-5xl",
      )}
      id={id}
    >
      <input
        ref={inputRef}
        type="text"
        className="bg-transparent outline-none"
        placeholder="New header..."
        value={latestItemValue.content}
        onChange={(e) => updateItem({ content: e.target.value })}
      />
      <span ref={spanRef} className="pointer-events-none invisible absolute left-0 whitespace-pre">
        {latestItemValue.content || "New header..."}
      </span>
    </ItemWrapper>
  );
}
