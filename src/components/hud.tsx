"use client";

import {
  ImageIcon,
  NotebookText,
  Shredder,
  StickyNoteIcon,
} from "lucide-react";
import { useItems, type BaseBoardItem, type BoardItem } from "./items";
import { usePanOffset } from "./pan-container";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

export default function HUD() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { setItems } = useItems();
  const offset = usePanOffset();

  function addItem(type: BoardItem["type"], offset: BaseBoardItem["offset"]) {
    const id = crypto.randomUUID();
    let data: BoardItem;

    switch (type) {
      case "lined-paper":
        data = {
          id,
          type: "lined-paper",
          title: "",
          content: "",
          offset,
          z: 0,
        };
        break;
      case "sticky":
        data = {
          id,
          type: "sticky",
          content: "",
          offset,
          z: 0,
        };
        break;
      case "still":
        data = {
          id,
          type: "still",
          title: "",
          src: "https://placehold.co/384",
          offset,
          z: 0,
        };
        break;
    }

    setItems((prev) => {
      const newItems = { ...prev };
      newItems[id] = data as BoardItem;
      const highest = Math.max(...Object.values(newItems).map((i) => i.z));
      newItems[id].z = highest > 0 || highest === 0 ? highest + 1 : 0;
      return newItems;
    });
  }

  useEffect(() => {
    function handleDeleteClick(e: MouseEvent) {
      e.preventDefault();
      let target = e.target as HTMLDivElement;
      let id;
      while (target && !id) {
        id = target.getAttribute("id");
        target = target.parentElement as HTMLDivElement;
      }
      if (id) {
        setItems((prev) => {
          const newItems = { ...prev };
          delete newItems[id];
          return newItems;
        });
      }
    }

    if (isDeleting) {
      document.addEventListener("click", handleDeleteClick);
    } else {
      document.removeEventListener("click", handleDeleteClick);
    }
    return () => {
      document.removeEventListener("click", handleDeleteClick);
    };
  }, [isDeleting, setItems]);

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
      <motion.div
        data-pannable
        data-visible={isDeleting}
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        initial={false}
        animate={{
          backgroundImage: isDeleting
            ? "radial-gradient(ellipse, transparent 80%, oklch(70.4% 0.191 22.216) 100%)"
            : "radial-gradient(ellipse, transparent 100%, oklch(93.6% 0.032 17.717) 100%)",
        }}
        className="pointer-events-none absolute h-dvh w-dvw opacity-60"
      />
      <nav
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        className="bg-background/50 absolute top-1/2 right-2 flex -translate-y-1/2 flex-col overflow-hidden rounded-full shadow-sm backdrop-blur-3xl"
        data-pannable
      >
        <button
          title="New sticky note"
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
          title="New lined paper"
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
          title="New image"
          className="hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all"
          onClick={(e) =>
            addItem("still", {
              x: e.clientX - offset.x - 632,
              y: e.clientY - offset.y - 340,
            })
          }
          data-pannable
        >
          <ImageIcon className="size-5" />
        </button>
        <button
          title={isDeleting ? "Cancel" : "Delete"}
          className="hover:bg-foreground/10 hover:text-destructive flex items-center justify-center rounded-lg p-2 transition-all"
          onClick={() => setIsDeleting(!isDeleting)}
          data-pannable
        >
          <Shredder className="size-5" />
        </button>
      </nav>
    </>
  );
}
