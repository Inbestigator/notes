"use client";

import { PackageOpen, Settings2, Shredder } from "lucide-react";
import { Project, useItems } from "./items";
import { usePanOffset } from "./pan-container";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { openFileDB } from "@/lib/db";
import plugins from "@/plugins";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import Link from "next/link";
import SettingsDialog from "./settings-dialog";

export default function HUD() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { setItems } = useItems();
  const searchParams = useSearchParams();
  const offset = usePanOffset();
  const baseButtonClasses: ClassValue =
    "hover:bg-foreground/10 flex items-center justify-center rounded-lg p-2 transition-all first:rounded-t-full last:rounded-b-full";

  function addItem(type: string, variant: number) {
    const id = crypto.randomUUID();
    const plugin = plugins.find((p) => p.name === type);
    const defaultProps =
      typeof plugin?.defaultProps === "function"
        ? plugin.defaultProps(variant)
        : plugin?.defaultProps;

    if (!plugin) return;

    setItems((prev) => {
      const newItems = { ...prev };
      newItems[id] = {
        id,
        type,
        offset: {
          x:
            window.innerWidth - (plugin.dimensions?.width ?? 0) - 52 - offset.x,
          y:
            window.innerHeight / 2 -
            (plugin.dimensions?.height ?? 0) / 2 -
            offset.y,
        },
        z: 0,
        variant,
        ...defaultProps,
      };
      const highest = Math.max(...Object.values(newItems).map((i) => i.z));
      newItems[id].z = highest > 0 || highest === 0 ? highest + 1 : 0;
      return newItems;
    });
  }

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
        setItems((prev) => {
          const newItems = { ...prev };
          const item = newItems[id];
          async function deleteImage(src: string) {
            const db = await openFileDB();
            const store = src.split(":")[1];
            const tx = db.transaction(store, "readwrite");
            await tx.store.delete(src);
          }
          if (
            "src" in item &&
            typeof item.src === "string" &&
            item.src.startsWith("upload:")
          ) {
            deleteImage(item.src);
          }
          delete newItems[id];
          return newItems;
        });
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
  }, [isDeleting, setItems]);

  useEffect(() => {
    setProjects(
      Object.entries(localStorage)
        .filter(([key]) => key.startsWith("project-"))
        .map((e) => JSON.parse(e[1]) as Project)
        .sort((a, b) => b.lastModified - a.lastModified),
    );
  }, []);

  function PluginButton({ plugin }: { plugin: (typeof plugins)[number] }) {
    const [variant, setVariant] = useState(1);

    if (!plugin.HudComponent) return null;

    return (
      <button
        key={plugin.name}
        title={`New ${plugin.displayName ?? plugin.name}`}
        className={baseButtonClasses as string}
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
  }

  if (searchParams.has("!hud")) {
    return null;
  }

  return (
    <>
      <div
        data-visible={offset.x === 0 && offset.y === 0 && !isDeleting}
        className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-full p-2 text-center text-sm text-nowrap backdrop-blur-3xl transition-all data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      >
        Scroll on the trackpad or drag while middle-clicking to pan
        <br />
        Double-click an item to bring it to the front
      </div>
      <div
        data-visible={isDeleting}
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        className="bg-background/50 absolute top-2 left-1/2 -translate-x-1/2 cursor-default rounded-full p-2 text-center text-sm text-nowrap shadow-sm backdrop-blur-3xl transition-opacity data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      >
        Click an item to delete it, or click the delete button again to cancel
      </div>
      <motion.div
        data-pannable
        data-visible={isDeleting}
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        initial={false}
        animate={{
          backgroundImage: isDeleting
            ? "radial-gradient(ellipse, transparent 80%, oklch(70.4% 0.191 22.216) 100%)"
            : "radial-gradient(ellipse, transparent 100%, oklch(93.6% 0.032 17.717) 100%)",
        }}
        className="pointer-events-none absolute h-dvh w-dvw opacity-60"
      />
      <nav
        style={{
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          willChange: "transform",
        }}
        className="bg-background/50 absolute top-1/2 right-2 flex -translate-y-1/2 flex-col rounded-full shadow-sm backdrop-blur-3xl"
        data-pannable
      >
        {plugins
          .filter((p) => p.isRequired || searchParams.has("p:" + p.name))
          .map((plugin) => (
            <PluginButton key={plugin.name} plugin={plugin} />
          ))}
        <hr className="bg-foreground/10" />
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
            <nav className="bg-background/50 absolute top-0 right-full origin-top-right -translate-x-2 rounded-lg shadow-sm backdrop-blur-3xl">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`?i=${p.id}${p.plugins
                    .filter(
                      (p) => !plugins.find((p2) => p2.name === p)?.isRequired,
                    )
                    .map((p) => `&p:${p}`)
                    .join("")}`}
                  className={cn(baseButtonClasses, "rounded-lg! text-nowrap")}
                  data-pannable
                >
                  {p.title ?? "Untitled Project"}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <button
          title="Settings"
          className={baseButtonClasses}
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
      <SettingsDialog
        offset={offset}
        open={isSettingsOpen}
        setOpen={setIsSettingsOpen}
        project={projects.find((p) => p.id === searchParams.get("i"))}
      />
    </>
  );
}
