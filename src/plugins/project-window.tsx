"use client";

import { useItems, type BaseItem, type Project } from "@/components/items";
import type { Plugin } from ".";
import IFrame from "@/components/primitives/iframe";
import Link from "next/link";
import plugins from "./index";
import { useEffect } from "react";

interface ProjectWindow extends BaseItem {
  type: "project-window";
  project: Project;
}

export default {
  name: "project-window",
  RenderedComponent,
} as Plugin<ProjectWindow>;

function RenderedComponent({ id, item }: { id: string; item: ProjectWindow }) {
  useEffect(() => {
    const handleItemUpdate = (e: Event) => {
      if (e instanceof CustomEvent) {
        if (
          !e.detail ||
          !e.detail.id ||
          !e.detail.partial ||
          e.detail.id !== `${id}title`
        )
          return;

        localStorage.setItem(
          `project-${item.project.id}`,
          JSON.stringify({
            ...item.project,
            title: e.detail.partial.content,
          }),
        );
      }
    };

    window.addEventListener("itemUpdate", handleItemUpdate);
    return () => {
      window.removeEventListener("itemUpdate", handleItemUpdate);
    };
  }, [id, item.project]);

  const link = `?i=${item.project.id}${item.project.plugins
    .filter((p) => !plugins.find((p2) => p2.name === p)?.isRequired)
    .map((p) => `&p:${p}`)
    .join("")}`;
  const items = useItems();
  const offset = items.items[id].offset;

  return (
    <Link
      href={link}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className="absolute h-[75dvh] w-[75dvw]"
    >
      <div
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
        }}
      >
        <IFrame
          id={id}
          props={{
            src: link + `&!hud`,
            width: window.innerWidth * 0.75,
            height: window.innerHeight * 0.75,
          }}
          className="pointer-events-none"
        />
      </div>
      <div data-pannable className="absolute inset-0 bg-transparent" />
    </Link>
  );
}
