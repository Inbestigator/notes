"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { nanoid } from "nanoid";
import { BaseItem } from "./items";
import { openFileDB } from "@/lib/db";
import plugins from "@/plugins";
import { decryptData, splitBuffers } from "@/lib/encryption";
import { useAtom, useSetAtom } from "jotai";
import { offsetAtom } from "@/lib/state";
import { currentProjectAtom, itemsAtom } from "@/lib/state";

export interface Project {
  id: string;
  title?: string;
  lastModified: number;
  offset: { x: number; y: number; z: number };
  plugins: string[];
  items: BaseItem[];
}

export function getProjects() {
  if (typeof localStorage === "undefined") return [];
  const projects = Object.entries(localStorage)
    .filter(([key]) => key.startsWith("project-"))
    .map((e) => JSON.parse(e[1]) as Project)
    .sort((a, b) => b.lastModified - a.lastModified);
  return projects;
}

function fetchOrNewProject(id: string) {
  const projects = getProjects();
  let project = projects.find((p) => p.id === id) ?? null;
  if (!project) {
    project = {
      id,
      lastModified: -1,
      offset: { x: 0, y: 0, z: 1 },
      plugins: [],
      items: [],
    };
  }

  return project;
}

export default function ProjectManager() {
  const [currentProject, setCurrentProject] = useAtom(currentProjectAtom);
  const [items, setItems] = useAtom(itemsAtom);
  const searchParams = useSearchParams();
  const setOffset = useSetAtom(offsetAtom);

  const loadJsonProject = useCallback(
    async ({
      type,
      version,
      project,
      files,
    }: {
      type: string;
      version: number;
      project: Project;
      files: Record<string, Record<string, unknown>>;
    }) => {
      if (type !== "organote" || !version || !project) return false;
      if (version === 2) {
        const db = await openFileDB();
        for await (const [store, items] of Object.entries(files)) {
          const tx = db.transaction(store, "readwrite");
          for (const [key, value] of Object.entries(items)) {
            await tx.store.put(value, key);
          }
        }
      }
      if (version < 3) {
        project.items = Object.values(project.items);
      }
      localStorage.setItem(`project-${project.id}`, JSON.stringify(project));
      const params = new URLSearchParams(searchParams);
      params.set("i", project.id);
      params.delete("e");
      window.history.replaceState(
        null,
        "",
        `?${params.toString()}${project.plugins.map((p: string) => `&p:${p}`).join("")}`,
      );
      return true;
    },
    [searchParams],
  );

  useEffect(() => {
    async function handleOpen(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "o" && e.metaKey) {
        e.preventDefault();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".note";
        input.onchange = async () => {
          if (input.files === null || input.files.length === 0) return;
          const file = input.files[0];
          const text = await file.text();
          const data = JSON.parse(text);
          await loadJsonProject(data);
        };
        input.click();
        input.remove();
      }
    }
    window.addEventListener("keydown", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleOpen);
    };
  }, [loadJsonProject]);

  useEffect(() => {
    async function updateProject() {
      const searchId = searchParams.get("i");
      let externalDownload = searchParams.get("e");
      let key: string | null = null;
      const hash = location.hash;

      if (!externalDownload && hash.startsWith("#s=")) {
        const [id, k] = hash.slice("#s=".length).split(",");
        externalDownload = `/api/store?id=${id}`;
        key = k;
      }

      if (externalDownload) {
        const res = await fetch(externalDownload);
        if (!res.ok) return;
        let json;
        if (key) {
          const arrayBuffer = await res.arrayBuffer();
          const [iv, encrypted] = splitBuffers(new Uint8Array(arrayBuffer));
          const decrypted = await decryptData(iv, encrypted, key);
          const decoded = new TextDecoder().decode(decrypted);
          json = JSON.parse(decoded);
        } else {
          json = await res.json();
        }
        const result = await loadJsonProject(json);
        if (result) {
          return;
        }
      }

      if (!searchId) {
        const id = nanoid(7);
        const params = new URLSearchParams(searchParams);
        params.set("i", id);
        window.history.replaceState(null, "", `?${params.toString()}`);
        return;
      }

      const project = fetchOrNewProject(searchId);
      setCurrentProject(project);
      setItems(project.items);
      const initialX = Number(searchParams.get("x") ?? NaN);
      const initialY = Number(searchParams.get("y") ?? NaN);
      const initialZ = Number(searchParams.get("z") ?? NaN);

      if (!isNaN(initialX) && !isNaN(initialY) && !isNaN(initialZ)) {
        setOffset({ x: initialX, y: initialY, z: initialZ });
      } else {
        setOffset({
          x: project.offset.x ?? 0,
          y: project.offset.y ?? 0,
          z: project.offset.z ?? 1,
        });
      }
    }
    updateProject();
  }, [searchParams, loadJsonProject, setOffset, setCurrentProject, setItems]);

  useEffect(() => {
    if (
      !currentProject ||
      (!currentProject.title &&
        items.length === 0 &&
        (!currentProject.lastModified || currentProject.lastModified === -1)) ||
      searchParams.has("!ls")
    )
      return;
    localStorage.setItem(
      `project-${currentProject.id}`,
      JSON.stringify({
        ...currentProject,
        lastModified: Date.now(),
        items,
        plugins: new Set(currentProject.items.map((i) => i.type))
          .values()
          .filter((ps) => !plugins.find((p) => p.name === ps)?.isRequired)
          .toArray(),
      }),
    );
  }, [currentProject, searchParams, items]);

  useEffect(() => {
    const handleProjectUpdate = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (!e.detail || !e.detail.id || !e.detail.partial) return;
        setCurrentProject((prev) => ({
          ...prev,
          ...e.detail.partial,
        }));
      }
    };

    window.addEventListener("projectUpdate", handleProjectUpdate);
    return () => {
      window.removeEventListener("projectUpdate", handleProjectUpdate);
    };
  });

  return null;
}
