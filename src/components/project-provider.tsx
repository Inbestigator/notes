"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState(searchParams.get("i"));

  useEffect(() => {
    setProjectId(searchParams.get("i"));
  }, [searchParams]);

  useEffect(() => {
    setProjects(
      Object.entries(localStorage)
        .filter(([key]) => key.startsWith("project-"))
        .map((e) => JSON.parse(e[1]) as Project)
        .sort((a, b) => b.lastModified - a.lastModified),
    );
  }, []);

  useEffect(() => {
    if (
      !projectId ||
      (!projects.some((p) => p.id === projectId) && projects.length)
    ) {
      const id = projectId ?? nanoid(7);
      window.history.replaceState(null, "", `?i=${id}`);
      setProjects((prev) => [
        ...prev,
        {
          id,
          title: "",
          lastModified: Date.now(),
          offset: { x: 0, y: 0 },
          plugins: [],
          items: {},
        },
      ]);
      setProjectId(id);
      return;
    }
    setCurrentProject(projects.find((p) => p.id === projectId) ?? null);
  }, [projectId, projects]);

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
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
