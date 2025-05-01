"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import plugins from "@/plugins";
import { openFileDB } from "@/lib/db";
import { useItems, useSetCurrentProject } from "./project-provider";

export interface BaseItem {
  id: string;
  type: string;
  offset: { x: number; y: number };
  z: number;
  variant: number;
}

export function useItemOffset(id: string) {
  const items = useItems();
  return items[id].offset;
}

export default function Items() {
  const items = useItems();
  const searchParams = useSearchParams();
  useItemManager();

  const handleBringToFront = useCallback(
    (id: string, currentZ: number) => {
      const highest = Math.max(...Object.values(items).map((i) => i.z));
      window.dispatchEvent(
        new CustomEvent("itemUpdate", {
          detail: {
            id,
            partial: {
              z: highest > currentZ || highest === 0 ? highest + 1 : currentZ,
            },
          },
        }),
      );
    },
    [items],
  );

  return Object.values(items)
    .sort((a, b) => a.z - b.z)
    .map((item) => {
      const plugin = plugins
        .filter((p) => p.isRequired || searchParams.has("p:" + p.name))
        .find((p) => p.name === item.type);
      if (!plugin) return null;

      return (
        <div
          id={item.id}
          key={item.id}
          onDoubleClick={() => handleBringToFront(item.id, item.z)}
          className="font-(family-name:--font-excalifont)"
        >
          <plugin.RenderedComponent id={item.id} item={item as never} />
        </div>
      );
    });
}

function useItemManager() {
  const setCurrentProject = useSetCurrentProject();

  const updateItem = useCallback(
    (
      id: string,
      item:
        | Partial<BaseItem>
        | ((prev: Record<string, BaseItem>) => Partial<BaseItem>),
    ) => {
      setCurrentProject((prev) => {
        const newItems = { ...prev.items };
        if (typeof item === "function") {
          item = item(newItems);
        }
        newItems[id] = {
          ...newItems[id],
          ...item,
        };
        return {
          ...prev,
          items: newItems,
        };
      });
    },
    [setCurrentProject],
  );

  useEffect(() => {
    const handleItemCreate = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (!e.detail || !e.detail.id) return;
        setCurrentProject((prev) => {
          const newItems = { ...prev.items };
          const { deductGlobalOffset, dimensions, ...item } =
            e.detail as BaseItem & {
              deductGlobalOffset?: boolean;
              dimensions?: { width: number; height: number };
            };
          newItems[e.detail.id] = {
            ...e.detail,
            offset:
              deductGlobalOffset && dimensions
                ? {
                    x:
                      -dimensions.width +
                      (window.innerWidth - 52 - window.offset.x) /
                        window.offset.z,
                    y:
                      -dimensions.height / 2 +
                      (window.innerHeight / 2 - window.offset.y) /
                        window.offset.z,
                  }
                : item.offset,
          };
          const highest = Math.max(...Object.values(newItems).map((i) => i.z));
          newItems[e.detail.id].z =
            highest > 0 || highest === 0 ? highest + 1 : 0;
          return {
            ...prev,
            items: newItems,
          };
        });
      }
    };
    const handleItemUpdate = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (!e.detail || !e.detail.id || !e.detail.partial) return;
        updateItem(e.detail.id, e.detail.partial);
      }
    };
    const handleItemDelete = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (!e.detail || !e.detail.id) return;
        setCurrentProject((prev) => {
          const newItems = { ...prev.items };
          const item = newItems[e.detail.id];
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
          delete newItems[e.detail.id];
          return { ...prev, items: newItems };
        });
      }
    };

    window.addEventListener("itemCreate", handleItemCreate);
    window.addEventListener("itemUpdate", handleItemUpdate);
    window.addEventListener("itemDelete", handleItemDelete);
    return () => {
      window.removeEventListener("itemCreate", handleItemCreate);
      window.removeEventListener("itemUpdate", handleItemUpdate);
      window.removeEventListener("itemDelete", handleItemDelete);
    };
  }, [setCurrentProject, updateItem]);
}
