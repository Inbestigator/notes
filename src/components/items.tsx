"use client";

import { useSearchParams } from "next/navigation";
import plugins from "@/plugins";
import { highestZAtom, itemFamilyAtom, itemsAtom } from "@/lib/state";
import { useAtomValue } from "jotai";
import useUpdateItem from "@/lib/hooks/useUpdateItem";

export interface BaseItem {
  id: string;
  type: string;
  offset: { x: number; y: number };
  z: number;
  variant: number;
}

export function useItemOffset(id: string) {
  const item = useAtomValue(itemFamilyAtom(id));
  return item.offset;
}

export default function ItemList() {
  const items = useAtomValue(itemsAtom);

  return items
    .sort((a, b) => a.z - b.z)
    .map((item) => (
      <div key={item.id}>
        <Item id={item.id} />
      </div>
    ));
}

function Item({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const item = useAtomValue(itemFamilyAtom(id));
  const highestZ = useAtomValue(highestZAtom);
  const setItem = useUpdateItem(id);

  function handleBringToFront() {
    const z = highestZ > item.z || highestZ === 0 ? highestZ + 1 : item.z;
    setItem({ z });
  }

  const plugin = plugins
    .filter((p) => p.isRequired || searchParams.has("p:" + p.name))
    .find((p) => p.name === item.type);
  if (!plugin) return null;

  return (
    <div
      key={item.id}
      onDoubleClick={handleBringToFront}
      className="font-(family-name:--font-excalifont)"
    >
      <plugin.RenderedComponent id={item.id} item={item as never} />
    </div>
  );
}
