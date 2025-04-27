"use client";

import { Image, NotebookText, StickyNoteIcon, Trash } from "lucide-react";
import type { BaseBoardItem, BoardItem } from "@/app/page";
import { usePanOffset } from "./pan-container";
import { useState } from "react";

export default function HUD({
  addItem,
  removeItem,
}: {
  addItem: (type: BoardItem["type"], offset: BaseBoardItem["offset"]) => void;
  removeItem: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const offset = usePanOffset();

  function handleDeleteClick(e: MouseEvent) {
    let target = e.target as HTMLDivElement;
    let id;
    while (target && !id) {
      id = target.getAttribute("id");
      target = target.parentElement as HTMLDivElement;
    }
    if (id) removeItem(id);
    setIsDeleting(false);
    window.document.body.style.cursor = "";
    window.removeEventListener("click", handleDeleteClick);
  }

  return (
    <>
      <div
        data-visible={offset.x === 0 && offset.y === 0}
        className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-full p-2 text-sm backdrop-blur-3xl transition-all data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      >
        Scroll on the trackpad or drag while middle-clicking to pan
      </div>
      <div
        data-visible={isDeleting}
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-full p-2 text-sm shadow-sm backdrop-blur-3xl transition-opacity data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      >
        Click an item to delete it, or click the delete button again to cancel
      </div>
      <nav
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        className="bg-background/50 absolute top-1/2 right-2 flex -translate-y-1/2 flex-col overflow-hidden rounded-full shadow-sm backdrop-blur-3xl"
        data-pannable
      >
        <button
          className="hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all"
          onClick={(e) =>
            addItem("sticky", {
              x: e.clientX - offset.x - 280,
              y: e.clientY - offset.y - 105.25,
            })
          }
          data-pannable
        >
          <StickyNoteIcon className="size-5" />
        </button>
        <button
          className="hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all"
          onClick={(e) =>
            addItem("lined-paper", {
              x: e.clientX - offset.x - 632,
              y: e.clientY - offset.y - 340,
            })
          }
          data-pannable
        >
          <NotebookText className="size-5" />
        </button>
        <button
          className="hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all"
          onClick={(e) =>
            addItem("still", {
              x: e.clientX - offset.x - 632,
              y: e.clientY - offset.y - 340,
            })
          }
          data-pannable
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="size-5" />
        </button>
        <button
          className="hover:bg-foreground/10 hover:text-destructive flex items-center justify-center rounded-lg p-2 transition-all"
          onClick={() => {
            if (isDeleting) {
              setIsDeleting(false);
              window.document.body.style.cursor = "";
              window.removeEventListener("click", handleDeleteClick);
              return;
            }
            setIsDeleting(true);
            setTimeout(
              () => window.addEventListener("click", handleDeleteClick),
              150,
            );
          }}
          data-pannable
        >
          <Trash className="size-5" />
        </button>
      </nav>
    </>
  );
}
