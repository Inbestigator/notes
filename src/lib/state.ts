import { BaseItem } from "@/components/items";
import { Project } from "@/components/project-manager";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

export const currentProjectAtom = atom({} as Project);
export const itemsAtom = atom<BaseItem[]>([]);
export const itemFamilyAtom = atomFamily((id: string) =>
  atom((get) => get(itemsAtom).find((i) => i.id === id) as BaseItem),
);

export const offsetAtom = atom({ x: 0, y: 0, z: 1 });

export const highestZAtom = atom((get) => {
  const items = get(itemsAtom);
  return items.length === 0 ? 0 : Math.max(...items.map((item) => item.z));
});
export const sortedItemsAtom = atom((get) => {
  const items = get(itemsAtom);
  return items.sort((a, b) => a.z - b.z);
});

export const deleteModeAtom = atom(false);
