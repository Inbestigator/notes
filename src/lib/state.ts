import { BaseItem } from "@/components/items";
import { Project } from "@/components/project-manager";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

export const currentProjectAtom = atom({} as Project);
export const itemsAtom = atom<string[]>([]);
export const itemFamilyAtom = atomFamily(
  (item: { id: string } & Partial<BaseItem>) => atom(item as BaseItem),
  (a, b) => a.id === b.id,
);

export const offsetAtom = atom({ x: 0, y: 0, z: 1 });

export const highestZAtom = atom((get) => {
  const items = get(itemsAtom);
  return Math.max(...items.map((id) => get(itemFamilyAtom({ id })).z ?? 0));
});
export const sortedItemsAtom = atom((get) => {
  const items = get(itemsAtom);
  return items.sort(
    (a, b) =>
      get(itemFamilyAtom({ id: a })).z - get(itemFamilyAtom({ id: b })).z,
  );
});
