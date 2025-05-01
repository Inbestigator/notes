"use client";

import type { BaseItem } from "@/components/items";
import type { Plugin } from ".";
import { Heading1, Heading2, Heading3 } from "lucide-react";
import { cn } from "@/lib/utils";
import ItemWrapper from "@/components/item-wrapper";
import { useDebouncedCallback } from "use-debounce";
import { memo } from "react";

interface Header extends BaseItem {
  type: "header";
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
  RenderedComponent: memo(RenderedComponent),
} as Plugin<Header>;

function RenderedComponent({ id, item }: { id: string; item: Header }) {
  const debouncedContent = useDebouncedCallback((content) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { content } },
      }),
    );
  }, 150);
  return (
    <ItemWrapper tabClassName="bg-neutral-200" id={id}>
      <input
        type="text"
        className={cn(
          "w-fit p-2 outline-none",
          "text-5xl font-bold",
          item.variant === 2 && "text-3xl font-semibold",
          item.variant === 3 && "text-xl font-medium",
        )}
        placeholder="New header..."
        defaultValue={item.content}
        onChange={(e) => debouncedContent(e.target.value)}
      />
    </ItemWrapper>
  );
}
