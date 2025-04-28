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
  const projectId = currentProject?.id;

  const changeProject = useCallback((id: string) => {
    const projects = Object.entries(localStorage)
      .filter(([key]) => key.startsWith("project-"))
      .map((e) => JSON.parse(e[1]) as Project)
      .sort((a, b) => b.lastModified - a.lastModified);
    let project = projects.find((p) => p.id === id) ?? null;
    if (!project) {
      project = {
        id,
        title: "",
        lastModified: Date.now(),
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
    let searchId = searchParams.get("i");
    if (!searchId) {
      const id = nanoid(7);
      const params = new URLSearchParams(searchParams);
      params.set("i", id);
      window.history.replaceState(null, "", `?${params.toString()}`);
      searchId = id;
    }
    const project = changeProject(searchId);
    setInitialOffset(project.offset);
  }, [changeProject, searchParams]);

  useEffect(() => {
    if (
      !currentProject ||
      (!currentProject.title && Object.keys(currentProject.items).length === 0)
    )
      return;
    localStorage.setItem(
      `project-${projectId}`,
      JSON.stringify({
        ...currentProject,
        plugins: new Set(Object.values(currentProject.items).map((i) => i.type))
          .values()
          .toArray(),
      }),
    );
  }, [projectId, currentProject]);

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
        className="absolute inset-0 bg-[size:32px] bg-clip-border"
        style={{
          backgroundImage: "url('/dots.png')",
          willChange: "background-position",
        }}
      />
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
