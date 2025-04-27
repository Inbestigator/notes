"use client";

import { Shredder } from "lucide-react";
import { useItems } from "./items";
import { usePanOffset } from "./pan-container";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { openFileDB } from "@/lib/db";
import plugins from "@/plugins";
import { useSearchParams } from "next/navigation";

export default function HUD() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { setItems } = useItems();
  const searchParams = useSearchParams();
  const offset = usePanOffset();

  function addItem(type: string, variant: number) {
    const id = crypto.randomUUID();
    const plugin = plugins.find((p) => p.name === type);
    const defaultProps =
      typeof plugin?.defaultProps === "function"
        ? plugin.defaultProps(variant)
        : plugin?.defaultProps;

    if (!plugin) return;

    setItems((prev) => {
      const newItems = { ...prev };
      newItems[id] = {
        id,
        type,
        offset: {
          x:
            window.innerWidth - (plugin.dimensions?.width ?? 0) - 52 - offset.x,
          y:
            window.innerHeight / 2 -
            (plugin.dimensions?.height ?? 0) / 2 -
            offset.y,
        },
        z: 0,
        variant,
        ...defaultProps,
      };
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
          const item = newItems[id];
          async function deleteImage(src: string) {
            const db = await openFileDB();
            const store = src.split(":")[1];
            const tx = db.transaction(store, "readwrite");
            await tx.store.delete(src);
          }
          if (
            "src" in item &&
            typeof item.src === "string" &&
            item.src.startsWith("upload:")
          ) {
            deleteImage(item.src);
          }
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

  function PluginButton({ plugin }: { plugin: (typeof plugins)[number] }) {
    const [variant, setVariant] = useState(1);

    if (!plugin.HudComponent) return null;

    return (
      <button
        key={plugin.name}
        title={`New ${plugin.displayName ?? plugin.name}`}
        className="hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all"
        onContextMenu={(e) => {
          e.preventDefault();
          setVariant((prev) => (prev % (plugin.numVariants ?? 1)) + 1);
        }}
        onClick={() => addItem(plugin.name, variant)}
        data-pannable
      >
        <plugin.HudComponent variant={variant} />
      </button>
    );
  }

  if (searchParams.has("!hud")) {
    return null;
  }

  return (
    <>
      <div
        data-visible={offset.x === 0 && offset.y === 0 && !isDeleting}
        className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-full p-2 text-center text-sm text-nowrap backdrop-blur-3xl transition-all data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      >
        Scroll on the trackpad or drag while middle-clicking to pan
        <br />
        Double-click an item to bring it to the front
      </div>
      <div
        data-visible={isDeleting}
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-full p-2 text-center text-sm text-nowrap shadow-sm backdrop-blur-3xl transition-opacity data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
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
        {plugins
          .filter((p) => p.isRequired || searchParams.has("p:" + p.name))
          .map((plugin) => (
            <PluginButton key={plugin.name} plugin={plugin} />
          ))}
        <button
          title={isDeleting ? "Cancel" : "Delete"}
          data-active={isDeleting}
          className="hover:bg-foreground/10 hover:text-destructive data-[active=true]:text-destructive flex items-center justify-center rounded-lg p-2 transition-all"
          onClick={() => setIsDeleting(!isDeleting)}
          data-pannable
        >
          <Shredder className="size-5" />
        </button>
      </nav>
    </>
  );
}
