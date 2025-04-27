import type { BaseItem, Project } from "@/components/items";
import type { Plugin } from ".";
import IFrame from "@/components/primitives/iframe";
import Link from "next/link";
import plugins from "./index";

interface ProjectWindow extends BaseItem {
  type: "project-window";
  project: Project;
}

export default {
  name: "project-window",
  RenderedComponent,
} as Plugin<ProjectWindow>;

function RenderedComponent({ id, item }: { id: string; item: ProjectWindow }) {
  const link = `?i=${item.project.id}${item.project.plugins
    .filter((p) => !plugins.find((p2) => p2.name === p)?.isRequired)
    .map((p) => `&p:${p}`)
    .join("")}`;
  return (
    <Link href={link} className="absolute h-96 w-xl">
      <IFrame
        id={id}
        props={{
          src: link + `&!hud`,
          width: 576,
          height: 384,
        }}
      />
      <div className="absolute inset-0 bg-transparent" />
    </Link>
  );
}
