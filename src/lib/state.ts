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
        }),
      );
    }
    curr.lastModified = Date.now();
    set(hiddenCurrentProjectAtom, curr);
  },
);
export const itemsAtom = focusAtom(currentProjectAtom, (o) => o.prop("items"));
export const offsetAtom = focusAtom(currentProjectAtom, (o) =>
  o.prop("offset"),
);
export const zoomAtom = focusAtom(currentProjectAtom, (o) =>
  o.prop("offset").prop("z"),
);
export const enabledPluginsAtom = atom(
  (get) => get(hiddenCurrentProjectAtom).plugins,
  (get, set, fn: (p: string[]) => string[]) => {
    const curr = fn(get(enabledPluginsAtom)).filter(
      (e) => !plugins.find((p) => p.name === e)?.isRequired,
    );
    const params = new URLSearchParams(window.location.search);
    params.keys().forEach((p) => p.startsWith("p:") && params.delete(p));
    for (const plugin of curr) {
      params.set("p:" + plugin, "");
    }
    window.history.replaceState(null, "", "?" + params.toString());
    set(currentProjectAtom, { ...get(currentProjectAtom), plugins: curr });
  },
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
