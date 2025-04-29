"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { nanoid } from "nanoid";
import { BaseItem } from "./items";
import { openFileDB } from "@/lib/db";
import { Loader2 } from "lucide-react";
import plugins from "@/plugins";
import { decryptData, splitBuffers } from "@/lib/encryption";

export interface Project {
  id: string;
  title?: string;
  lastModified: number;
  offset: { x: number; y: number };
  plugins: string[];
  items: Record<string, BaseItem>;
}

const ProjectContext = createContext(
  {} as {
    currentProject: Project;
    projects: Project[];
    setCurrentProject: React.Dispatch<React.SetStateAction<Project>>;
    initialOffset: Project["offset"];
    changeProject: (id: string) => Project | null;
  },
);

export const useProject = () => useContext(ProjectContext);

export default function ProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });
  const searchParams = useSearchParams();

  const changeProject = useCallback((id: string) => {
    const projects = Object.entries(localStorage)
      .filter(([key]) => key.startsWith("project-"))
      .map((e) => JSON.parse(e[1]) as Project)
      .sort((a, b) => b.lastModified - a.lastModified);
    let project = projects.find((p) => p.id === id) ?? null;
    if (!project) {
      project = {
        id,
        lastModified: -1,
        offset: { x: 0, y: 0 },
        plugins: [],
        items: {},
      };
      projects.push(project);
    }
    setProjects(projects);
    setCurrentProject(project);
    return project;
  }, []);

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
        if (json.type === "organote") {
          const downloadedProject = json.project as Project;
          if (json.version === 2) {
            const db = await openFileDB();
            const files: Record<string, Record<string, unknown>> = json.files;
            for await (const [store, items] of Object.entries(files)) {
              const tx = db.transaction(store, "readwrite");
              for (const [key, value] of Object.entries(items)) {
                await tx.store.put(value, key);
              }
            }
          }
          localStorage.setItem(
            `project-${downloadedProject.id}`,
            JSON.stringify(downloadedProject),
          );
          const params = new URLSearchParams(searchParams);
          params.set("i", downloadedProject.id);
          params.delete("e");
          window.history.replaceState(
            null,
            "",
            `?${params.toString()}${downloadedProject.plugins.map((p: string) => `&p:${p}`).join("")}`,
          );
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

      const project = changeProject(searchId);
      const initialX = Number(searchParams.get("x") ?? NaN);
      const initialY = Number(searchParams.get("y") ?? NaN);

      if (!isNaN(initialX) && !isNaN(initialY)) {
        setInitialOffset({ x: initialX, y: initialY });
      } else {
        setInitialOffset(project.offset);
      }
    }
    updateProject();
  }, [changeProject, searchParams]);

  useEffect(() => {
    if (
      !currentProject ||
      (!currentProject.title &&
        Object.keys(currentProject.items).length === 0 &&
        currentProject.lastModified === -1) ||
      searchParams.has("!ls")
    )
      return;
    localStorage.setItem(
      `project-${currentProject.id}`,
      JSON.stringify({
        ...currentProject,
        lastModified: Date.now(),
        plugins: new Set(Object.values(currentProject.items).map((i) => i.type))
          .values()
          .filter((ps) => !plugins.find((p) => p.name === ps)?.isRequired)
          .toArray(),
      }),
    );
  }, [currentProject, searchParams]);

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

  if (!currentProject)
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-[size:32px] bg-clip-border"
        style={{
          backgroundImage: "url('/dots.png')",
          willChange: "background-position",
        }}
      >
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject: setCurrentProject as React.Dispatch<
          React.SetStateAction<Project>
        >,
        projects,
        initialOffset,
        changeProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
