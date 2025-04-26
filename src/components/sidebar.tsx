"use client";

import { Image, NotebookText, StickyNoteIcon, Trash } from "lucide-react";
import { Button } from "./ui/button";
import type { BaseBoardItem, BoardItem } from "@/app/page";
import { usePanOffset } from "./pan-container";
import { useState } from "react";

export default function Sidebar({
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
      {isDeleting && (
        <div
          style={{
            transform: `translate(${-offset.x}px, ${-offset.y}px)`,
            willChange: "transform",
          }}
          className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-sm p-2 backdrop-blur-3xl"
        >
          Click an item to delete it, or click the delete button again to
          cancel.
        </div>
      )}
      <nav
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        className="bg-background/50 absolute top-1/2 right-2 flex -translate-y-1/2 flex-col rounded-sm backdrop-blur-3xl"
        data-pannable
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) =>
            addItem("sticky", {
              x: e.clientX - offset.x - 280,
              y: e.clientY - offset.y - 105.25,
            })
          }
          data-pannable
        >
          <StickyNoteIcon />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) =>
            addItem("lined-paper", {
              x: e.clientX - offset.x - 632,
              y: e.clientY - offset.y - 340,
            })
          }
          data-pannable
        >
          <NotebookText />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) =>
            addItem("still", {
              x: e.clientX - offset.x - 632,
              y: e.clientY - offset.y - 340,
            })
          }
          data-pannable
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="hover:text-destructive"
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
          <Trash />
        </Button>
      </nav>
    </>
  );
}
