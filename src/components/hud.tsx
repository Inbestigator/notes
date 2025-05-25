"use client";

import { Fullscreen, PackageOpen, Shredder, Shrink } from "lucide-react";
import { getProjects } from "./project-manager";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import plugins from "@/plugins";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { OpenSettings } from "./settings-dialog";
import { deleteModeAtom, loadingProjectAtom, offsetAtom } from "@/lib/state";
import { useAtom, useAtomValue } from "jotai";
import useCreateItem from "@/lib/hooks/useCreateItem";

export const baseButtonClasses =
  "hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all first:rounded-t-full last:rounded-b-full";

export default function HUD() {
  const [isDeleting, setIsDeleting] = useAtom(deleteModeAtom);
  const searchParams = useSearchParams();
  const isLoading = useAtomValue(loadingProjectAtom);

  if (searchParams.has("!hud") || isLoading) {
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
        data-visible={isDeleting}
        initial={false}
        animate={{
          backgroundImage: isDeleting
            ? "radial-gradient(ellipse, transparent 80%, oklch(70.4% 0.191 22.216) 100%)"
            : "radial-gradient(ellipse, transparent 100%, oklch(93.6% 0.032 17.717) 100%)",
        }}
        className="pointer-events-none absolute h-dvh w-dvw opacity-60"
      />
      <nav className="bg-background/50 absolute top-1/2 right-2 flex -translate-y-1/2 flex-col rounded-full shadow-sm backdrop-blur-3xl">
        <PluginList />
        <hr className="border-foreground/10" />
        <ProjectSelector />
        <OpenSettings />
        <button
          title={isDeleting ? "Cancel" : "Delete"}
          data-active={isDeleting}
          className={cn(
            baseButtonClasses,
            "hover:text-destructive data-[active=true]:text-destructive",
          )}
          onClick={() => setIsDeleting(!isDeleting)}
        >
          <Shredder className="size-5" />
        </button>
      </nav>
      <nav className="bg-background/50 absolute right-2 bottom-2 flex flex-col rounded-full shadow-sm backdrop-blur-3xl">
        <ResetZoom />
      </nav>
    </>
  );
}

function PluginList() {
  const searchParams = useSearchParams();
  return plugins
    .filter((p) => p.isRequired || searchParams.has("p:" + p.name))
    .map((plugin) => <PluginButton key={plugin.name} plugin={plugin} />);
}

function PluginButton({ plugin }: { plugin: (typeof plugins)[number] }) {
  const [variant, setVariant] = useState(1);
  const createItem = useCreateItem();
  const defaultProps =
    typeof plugin?.defaultProps === "function"
      ? plugin.defaultProps(variant)
      : plugin?.defaultProps;
  const pluginDimensions = (typeof plugin.dimensions === "function"
    ? plugin.dimensions(variant)
    : plugin.dimensions) ?? { width: 0, height: 0 };

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
      onClick={() => {
        createItem({
          id: crypto.randomUUID(),
          type: plugin.name,
          dimensions: pluginDimensions,
          offset: { x: 0, y: 0 },
          z: 0,
          variant,
          ...defaultProps,
        });
      }}
    >
      <plugin.HudComponent variant={variant} />
    </button>
  );
}

function ProjectSelector() {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const projects = getProjects();

  useEffect(() => {
    if (!isSelectorOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("#project-selector")) {
        setIsSelectorOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isSelectorOpen]);

  return (
    <div id="project-selector" className="relative">
      <button
        title="Projects"
        className={cn(baseButtonClasses, "rounded-lg!")}
        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
      >
        <PackageOpen className="size-5" />
      </button>
      {isSelectorOpen && (
        <nav
          className={cn(
            "bg-background/50 absolute top-0 right-full max-h-64 min-w-32 origin-top-right -translate-x-2 overflow-scroll rounded-lg shadow-sm backdrop-blur-3xl transition-all",
            isLoading && "pointer-events-none blur-sm select-none",
          )}
        >
          {projects.map((p) => (
            <Link
              onClick={(e) => {
                if (e.metaKey) return;
                setLoading(true);
              }}
              onNavigate={() => setLoading(false)}
              replace
              key={p.id}
              href={`?i=${p.id}${p.plugins.map((p) => `&p:${p}`).join("")}`}
              className={cn(
                baseButtonClasses,
                "justify-start rounded-lg! text-nowrap",
              )}
            >
              {p.title || "Untitled Project"}
            </Link>
          ))}
          <hr className="border-foreground/10 first:hidden" />
          <Link
            href="?"
            className={cn(
              baseButtonClasses,
              "justify-start rounded-lg! text-nowrap",
            )}
          >
            Create New
          </Link>
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
    >
      {offset.z !== 1 ? (
        <Fullscreen className="size-5" />
      ) : (
        <Shrink className="size-5" />
      )}
    </button>
  );
}
