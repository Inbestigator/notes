import { BaseItem } from "@/components/items";
import { Project } from "@/components/project-manager";
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { focusAtom } from "jotai-optics";
import { nanoid } from "nanoid";
import { generateUsername } from "unique-username-generator";
import plugins from "@/plugins";

export const randomProject = (): Project => ({
  id: nanoid(7),
  title: generateUsername(" "),
  lastModified: -1,
  plugins: [],
  items: [],
  offset: { x: 0, y: 0, z: 1 },
});

const hiddenCurrentProjectAtom = atom<Project>(randomProject());

export const currentProjectAtom = atom(
  (get) => get(hiddenCurrentProjectAtom),
  (get, set, curr: Project | ((p: Project) => Project)) => {
    if (typeof curr === "function") curr = curr(get(hiddenCurrentProjectAtom));
    if (curr.lastModified !== -1) {
      localStorage.setItem(
        `project-${curr.id}`,
        JSON.stringify({
          ...curr,
          lastModified: Date.now(),
          plugins: new Set(curr.items.map((i) => i.type))
            .values()
            .filter((ps) => !plugins.find((p) => p.name === ps)?.isRequired)
            .toArray(),
        }),
      );
    }
    curr.lastModified = Date.now();
    set(hiddenCurrentProjectAtom, curr);
  },
);
export const itemsAtom = focusAtom(currentProjectAtom, (optic) =>
  optic.prop("items"),
);
export const offsetAtom = focusAtom(currentProjectAtom, (optic) =>
  optic.prop("offset"),
);

export const itemFamilyAtom = atomFamily((id: string) =>
  atom((get) => get(itemsAtom).find((i) => i.id === id) as BaseItem),
);
export const highestZAtom = atom((get) => {
  const items = get(itemsAtom);
  return items.length === 0 ? 0 : Math.max(...items.map((item) => item.z));
});

export const deleteModeAtom = atom(false);
export const settingsOpenAtom = atom(false);
export const loadingProjectAtom = atom(true);
