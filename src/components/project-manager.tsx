"use client";

import { decompress } from "compress-json";
import { useAtom, useSetAtom } from "jotai";
import { nanoid } from "nanoid";
import { useSearchParams } from "next/navigation";
import { ungzip } from "node-gzip";
import { useEffect } from "react";
import { openFileDB } from "@/lib/db";
import { decryptData, splitBuffers } from "@/lib/encryption";
import { currentProjectAtom, loadingProjectAtom, randomProject } from "@/lib/state";
import type { BaseItem } from "./items";

export interface Project {
  id: string;
  title: string;
  lastModified: number;
  offset: { x: number; y: number; z: number };
  plugins: string[];
  items: BaseItem[];
}

export function getProjects(): Project[] {
  if (typeof localStorage === "undefined") return [];
  const projects = Object.entries(localStorage)
    .filter(([key]) => key.startsWith("project-"))
    .map((e) => JSON.parse(e[1]) as Project)
    .sort((a, b) => b.lastModified - a.lastModified)
    .map((p) => ({
      ...p,
      items: Array.isArray(p.items) ? p.items : (Object.values(p.items) as BaseItem[]),
    }));
  return projects;
}

function fetchOrNewProject(id: string) {
  const project = getProjects().find((p) => p.id === id);

  return project ? project : { ...randomProject(), id };
}

async function loadExportedProject({
  type,
  version,
  project,
  files,
}: {
  type: string;
  version: number;
  project: Project;
  files: Record<string, Record<string, unknown>>;
}) {
  if (type !== "organote" || !version || !project) return null;
  if (version > 1) {
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
    project.offset.z = 1;
  }
  localStorage.setItem(`project-${project.id}`, JSON.stringify(project));
  const params = new URLSearchParams(window.location.search);
  params.set("i", project.id);
  params.delete("e");
  window.history.replaceState(null, "", `?${params.toString()}`);
  return project;
}

async function deCompressExported(encoded: Buffer<ArrayBufferLike>) {
  const decoded = await ungzip(encoded);
  return decompress(JSON.parse(new TextDecoder().decode(decoded)));
}

export default function ProjectManager() {
  const searchParams = useSearchParams();
  const [currentProject, setCurrentProject] = useAtom(currentProjectAtom);
  const setLoading = useSetAtom(loadingProjectAtom);

  useEffect(() => {
    async function updateProject() {
      if (currentProject.id === searchParams.get("i")) return;
      setLoading(true);
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
        let arrayBuf: ArrayBuffer;
        if (key) {
          const arrayBuffer = await res.arrayBuffer();
          const [iv, encrypted] = splitBuffers(new Uint8Array(arrayBuffer));
          arrayBuf = await decryptData(iv, encrypted, key);
        } else {
          arrayBuf = await res.arrayBuffer();
        }
        const json = await deCompressExported(Buffer.from(arrayBuf));
        const project = await loadExportedProject(json);
        if (project) {
          setCurrentProject(project);
          setLoading(false);
          return;
        }
      }

      if (!searchId) {
        const params = new URLSearchParams(window.location.search);
        params.set("i", nanoid(7));
        params.delete("e");
        window.history.replaceState(null, "", `?${params.toString()}`);
        setLoading(false);
        return;
      }

      const project = fetchOrNewProject(searchId);
      const initialX = Number(searchParams.get("x") ?? NaN);
      const initialY = Number(searchParams.get("y") ?? NaN);
      const initialZ = Number(searchParams.get("z") ?? NaN);

      if (!Number.isNaN(initialX) && !Number.isNaN(initialY) && !Number.isNaN(initialZ)) {
        project.offset = { x: initialX, y: initialY, z: initialZ };
      }
      setCurrentProject(project);
      setLoading(false);
    }
    updateProject();
  }, [searchParams, setCurrentProject, setLoading, currentProject]);

  useEffect(() => {
    async function handleOpen(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "o" && e.metaKey) {
        e.preventDefault();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".gz";
        input.onchange = async () => {
          if (input.files === null || input.files.length === 0) return;
          setLoading(true);
          const file = input.files[0];
          const arrayBuf = await file.arrayBuffer();
          const data = await deCompressExported(Buffer.from(arrayBuf));
          const project = await loadExportedProject(data);
          if (project) {
            setCurrentProject(project);
          }
          setLoading(false);
        };
        input.click();
        input.remove();
      }
    }
    window.addEventListener("keydown", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleOpen);
    };
  }, [setCurrentProject, setLoading]);

  return null;
}
