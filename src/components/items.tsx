"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import plugins from "@/plugins";
import { openFileDB } from "@/lib/db";
import {
  currentProjectAtom,
  highestZAtom,
  itemFamilyAtom,
  offsetAtom,
  sortedItemsAtom,
} from "@/lib/state";
import { useAtomValue, useAtom } from "jotai";

export interface BaseItem {
  id: string;
  type: string;
  offset: { x: number; y: number };
  z: number;
  variant: number;
}

export function useItemOffset(id: string) {
  const item = useAtomValue(itemFamilyAtom({ id }));
  return item.offset;
}

export default function ItemList() {
  const items = useAtomValue(sortedItemsAtom);
  useItemManager();

  return items.map((id) => <Item key={id} id={id} />);
}

function Item({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [item, setItem] = useAtom(itemFamilyAtom({ id }));
  const highestZ = useAtomValue(highestZAtom);

  function handleBringToFront() {
    const z = highestZ > item.z || highestZ === 0 ? highestZ + 1 : item.z;
    setItem((prev) => ({ ...prev, z }));
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: {
          id,
          partial: {
            z,
          },
        },
      }),
    );
  }

  const plugin = plugins
    .filter((p) => p.isRequired || searchParams.has("p:" + p.name))
    .find((p) => p.name === item.type);
  if (!plugin) return null;

  return (
    <div
      id={item.id}
      key={item.id}
      onDoubleClick={handleBringToFront}
      style={{ zIndex: item.z }}
      className="relative font-(family-name:--font-excalifont)"
    >
      <plugin.RenderedComponent id={item.id} item={item as never} />
    </div>
  );
}

function useItemManager() {
  const setCurrentProject = useAtom(currentProjectAtom)[1];
  const offset = useAtomValue(offsetAtom);

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
                      (window.innerWidth - 52 - offset.x) / offset.z,
                    y:
                      -dimensions.height / 2 +
                      (window.innerHeight / 2 - offset.y) / offset.z,
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
  }, [setCurrentProject, updateItem, offset]);
}
