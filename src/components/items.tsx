"use client";

import { useContext, createContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { nanoid } from "nanoid";
import plugins from "@/plugins";

export interface BaseItem {
  id: string;
  type: string;
  offset: { x: number; y: number };
  z: number;
  variant: number;
}

export const ItemContext = createContext(
  {} as {
    items: Record<string, BaseItem>;
    setItems: React.Dispatch<React.SetStateAction<Record<string, BaseItem>>>;
  },
);

export function useItems() {
  return useContext(ItemContext);
}

export interface Project {
  id: string;
  title?: string;
  plugins: string[];
  items: Record<string, BaseItem>;
}

export default function Items({ children }: { children?: React.ReactNode }) {
  const [projectData, setProjectData] = useState({} as Project);
  const [items, setItems] = useState({} as Project["items"]);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("i");

  useEffect(() => {
    if (!projectId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("i", nanoid(7));
      window.history.replaceState(null, "", `?${params.toString()}`);
      return;
    }

    const storedProject = localStorage.getItem(`project-${projectId}`);
    if (storedProject) {
      const parsedProject = JSON.parse(storedProject) as Project;
      setProjectData(parsedProject);
      setItems(parsedProject.items);
    } else if (projectId === "pick") {
      const projects = Object.keys(localStorage).filter((k) =>
        k.startsWith("project-"),
      );
      setProjectData({
        id: projectId,
        title: "Pick a project",
        plugins: ["iframe"],
        items: {},
      });
      setItems(
        Object.fromEntries(
          projects.map((p) => {
            const project = JSON.parse(
              localStorage.getItem(p) ?? "",
            ) as Project;
            return [
              p,
              {
                id: p,
                type: "project-window",
                offset: { x: 0, y: 0 },
                z: 0,
                variant: 0,
                project,
              },
            ];
          }),
        ),
      );
    }
  }, [projectId, searchParams]);

  useEffect(() => {
    if (
      !projectId ||
      (!Object.keys(items).length &&
        !projectData.title &&
        !localStorage.getItem(`project-${projectId}`)) ||
      projectId === "pick"
    )
      return;
    localStorage.setItem(
      `project-${projectId}`,
      JSON.stringify({
        id: projectId,
        title: projectData.title,
        plugins: Object.values(items).map((i) => i.type),
        items,
      }),
    );
  }, [projectData, items, projectId, searchParams]);

  function updateItem(
    id: string,
    item:
      | Partial<BaseItem>
      | ((prev: Record<string, BaseItem>) => Partial<BaseItem>),
  ) {
    setItems((prev) => {
      const newItems = { ...prev };
      if (typeof item === "function") {
        item = item(newItems);
      }
      newItems[id] = {
        ...newItems[id],
        ...item,
      };
      return newItems;
    });
  }

  function handleBringToFront(id: string, currentZ: number) {
    updateItem(id, (i) => {
      const highest = Math.max(...Object.values(i).map((i) => i.z));
      return {
        z: highest > currentZ || highest === 0 ? highest + 1 : currentZ,
      };
    });
  }

  useEffect(() => {
    const handleItemUpdate = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (!e.detail || !e.detail.id || !e.detail.partial) return;

        updateItem(e.detail.id, e.detail.partial);
      }
    };

    window.addEventListener("itemUpdate", handleItemUpdate);
    return () => {
      window.removeEventListener("itemUpdate", handleItemUpdate);
    };
  }, []);

  return (
    <ItemContext.Provider value={{ items, setItems }}>
      {Object.values(items)
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
            >
              <plugin.RenderedComponent id={item.id} item={item as never} />
            </div>
          );
        })}
      {children}
    </ItemContext.Provider>
  );
}
