"use client";

import { useContext, createContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { nanoid } from "nanoid";
import plugins from "@/plugins";
import { usePanOffset, useSetPanOffset } from "./pan-container";

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
  lastModified: number;
  offset: { x: number; y: number };
  plugins: string[];
  items: Record<string, BaseItem>;
}

function createDashboard(projects: string[]) {
  return Object.fromEntries(
    projects
      .sort((a, b) => {
        const aData = JSON.parse(localStorage.getItem(a) ?? "") as Project;
        const bData = JSON.parse(localStorage.getItem(b) ?? "") as Project;
        return bData.lastModified - aData.lastModified;
      })
      .map((p, i) => {
        const project = JSON.parse(localStorage.getItem(p) ?? "") as Project;
        const xFactor = i * (window.innerWidth * 0.875);
        return [
          [
            p + "title",
            {
              id: p + "title",
              type: "header",
              offset: {
                x: i * (window.innerWidth * 0.875),
                y: window.innerHeight * 0.75,
              },
              z: 1,
              variant: 1,
              content: project.title ?? "Untitled Project",
            },
          ],
          [
            p,
            {
              id: p,
              type: "project-window",
              offset: { x: xFactor, y: 0 },
              z: 0,
              variant: 0,
              project,
            },
          ],
        ];
      })
      .flat(1),
  );
}

export default function Items({ children }: { children?: React.ReactNode }) {
  const [projectData, setProjectData] = useState({} as Project);
  const [items, setItems] = useState({} as Project["items"]);
  const searchParams = useSearchParams();
  const panOffset = usePanOffset();
  const setPanOffset = useSetPanOffset();
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
      setPanOffset(parsedProject.offset);
    } else if (projectId === "pick") {
      const projects = Object.keys(localStorage).filter((k) =>
        k.startsWith("project-"),
      );
      setProjectData({
        id: projectId,
        title: "Pick a project",
        offset: { x: 0, y: 0 },
        lastModified: Date.now(),
        plugins: ["iframe"],
        items: {},
      });
      setItems(createDashboard(projects));
    }
  }, [projectId, searchParams, setPanOffset]);

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
        offset: panOffset,
        lastModified: Date.now(),
        plugins: new Set(Object.values(items).map((i) => i.type))
          .values()
          .toArray(),
        items,
      }),
    );
  }, [projectData, items, projectId, searchParams, panOffset]);

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
