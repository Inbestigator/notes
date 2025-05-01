"use client";

import {
  Fullscreen,
  PackageOpen,
  Settings2,
  Shredder,
  Shrink,
} from "lucide-react";
import { getProjects } from "./project-manager";
import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";
import plugins from "@/plugins";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import Link from "next/link";
import SettingsDialog from "./settings-dialog";
import { offsetAtom } from "@/lib/state";
import { useAtom } from "jotai";

const baseButtonClasses: ClassValue =
  "hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all first:rounded-t-full last:rounded-b-full";

export default function HUD() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleDeleteClick(e: MouseEvent) {
      e.preventDefault();
      let target = e.target as HTMLDivElement;
      let id;
      while (target && !id) {
        id = target.getAttribute("id");
        target = target.parentElement as HTMLDivElement;
      }
      if (id) {
        window.dispatchEvent(
          new CustomEvent("itemDelete", {
            detail: { id },
          }),
        );
      }
    }

    if (isDeleting) {
      document.addEventListener("click", handleDeleteClick);
    } else {
      document.removeEventListener("click", handleDeleteClick);
    }
    return () => {
      document.removeEventListener("click", handleDeleteClick);
    };
  }, [isDeleting]);

  if (searchParams.has("!hud")) {
    return null;
  }

  return (
    <>
      <div
        data-visible={isDeleting}
        className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-full p-2 text-center text-sm text-nowrap shadow-sm backdrop-blur-3xl transition-opacity data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      >
        Click an item to delete it, or click the delete button again to cancel
      </div>
      <motion.div
        data-pannable
        data-visible={isDeleting}
        initial={false}
        animate={{
          backgroundImage: isDeleting
            ? "radial-gradient(ellipse, transparent 80%, oklch(70.4% 0.191 22.216) 100%)"
            : "radial-gradient(ellipse, transparent 100%, oklch(93.6% 0.032 17.717) 100%)",
        }}
        className="pointer-events-none absolute h-dvh w-dvw opacity-60"
      />
      <nav
        className="bg-background/50 absolute top-1/2 right-2 flex -translate-y-1/2 flex-col rounded-full shadow-sm backdrop-blur-3xl"
        data-pannable
      >
        <Plugins searchParams={searchParams} />
        <hr className="border-foreground/10" />
        <ProjectSelector />
        <button
          title="Settings"
          className={baseButtonClasses as string}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          data-pannable
        >
          <Settings2 className="size-5" />
        </button>
        <button
          title={isDeleting ? "Cancel" : "Delete"}
          data-active={isDeleting}
          className={cn(
            baseButtonClasses,
            "hover:text-destructive data-[active=true]:text-destructive",
          )}
          onClick={() => setIsDeleting(!isDeleting)}
          data-pannable
        >
          <Shredder className="size-5" />
        </button>
      </nav>
      <nav
        className="bg-background/50 absolute right-2 bottom-2 flex flex-col rounded-full shadow-sm backdrop-blur-3xl"
        data-pannable
      >
        <ResetZoom />
      </nav>
      <SettingsDialog open={isSettingsOpen} setOpen={setIsSettingsOpen} />
    </>
  );
}

const Plugins = memo(function Plugins({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  function addItem(type: string, variant: number) {
    const id = crypto.randomUUID();
    const plugin = plugins.find((p) => p.name === type);
    const defaultProps =
      typeof plugin?.defaultProps === "function"
        ? plugin.defaultProps(variant)
        : plugin?.defaultProps;

    if (!plugin) return;

    const pluginDimensions = (typeof plugin.dimensions === "function"
      ? plugin.dimensions(variant)
      : plugin.dimensions) ?? { width: 0, height: 0 };

    window.dispatchEvent(
      new CustomEvent("itemCreate", {
        detail: {
          id,
          type,
          dimensions: pluginDimensions,
          deductGlobalOffset: true,
          z: 0,
          variant,
          ...defaultProps,
        },
      }),
    );
  }

  const PluginButton = memo(function PluginButton({
    plugin,
  }: {
    plugin: (typeof plugins)[number];
  }) {
    const [variant, setVariant] = useState(1);

    if (!plugin.HudComponent) return null;

    return (
      <button
        key={plugin.name}
        title={`New ${plugin.displayName ?? plugin.name}`}
        className={baseButtonClasses}
        onContextMenu={(e) => {
          e.preventDefault();
          setVariant((prev) => (prev % (plugin.numVariants ?? 1)) + 1);
        }}
        onClick={() => addItem(plugin.name, variant)}
        data-pannable
      >
        <plugin.HudComponent variant={variant} />
      </button>
    );
  });

  return plugins
    .filter((p) => p.isRequired || searchParams.has("p:" + p.name))
    .map((plugin) => <PluginButton key={plugin.name} plugin={plugin} />);
});

function ProjectSelector() {
  const projects = getProjects();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  return (
    <div className="relative">
      <button
        title="Projects"
        className={cn(baseButtonClasses, "rounded-lg!")}
        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
        data-pannable
      >
        <PackageOpen className="size-5" />
      </button>
      {isSelectorOpen && (
        <nav className="bg-background/50 absolute top-0 right-full min-w-32 origin-top-right -translate-x-2 rounded-lg shadow-sm backdrop-blur-3xl">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`?i=${p.id}${p.plugins.map((p) => `&p:${p}`).join("")}`}
              className={cn(
                baseButtonClasses,
                "justify-start rounded-lg! text-nowrap",
              )}
              data-pannable
            >
              {p.title?.length ? p.title : "Untitled Project"}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

function ResetZoom() {
  const [offset, setOffset] = useAtom(offsetAtom);

  return (
    <button
      title={offset.z !== 1 ? "Reset zoom" : "Reset position"}
      className={cn(
        baseButtonClasses,
        "rounded-full data-[hidden=true]:hidden",
      )}
      onClick={() =>
        setOffset((prevOffset) => {
          const mouseX = window.innerWidth / 2;
          const mouseY = window.innerHeight / 2;
          const worldX = (mouseX - prevOffset.x) / prevOffset.z;
          const worldY = (mouseY - prevOffset.y) / prevOffset.z;

          const newOffsetX = mouseX - worldX;
          const newOffsetY = mouseY - worldY;

          return prevOffset.z !== 1
            ? { x: newOffsetX, y: newOffsetY, z: 1 }
            : { x: 0, y: 0, z: 1 };
        })
      }
      data-hidden={offset.x === 0 && offset.y === 0 && offset.z === 1}
      data-pannable
    >
      {offset.z !== 1 ? (
        <Fullscreen className="size-5" />
      ) : (
        <Shrink className="size-5" />
      )}
    </button>
  );
}
