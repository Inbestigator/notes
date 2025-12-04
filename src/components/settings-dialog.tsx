"use client";

import { upload } from "@vercel/blob/client";
import { compress } from "compress-json";
import { useAtom, useSetAtom } from "jotai";
import { Copy, Download, Settings2, UploadCloud } from "lucide-react";
import { nanoid } from "nanoid";
import { gzip } from "node-gzip";
import { useState } from "react";
import { openFileDB } from "@/lib/db";
import { concatBuffers, encryptData, generateEncryptionKey } from "@/lib/encryption";
import useDebouncedUpdate from "@/lib/hooks/useDebouncedUpdate";
import { deleteResource } from "@/lib/hooks/useDeleteItem";
import { useEnabledPlugins } from "@/lib/hooks/useEnabledPlugins";
import { currentProjectAtom, settingsOpenAtom } from "@/lib/state";
import plugins from "@/plugins";
import { baseButtonClasses } from "./hud";
import { getProjects } from "./project-manager";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

export function OpenSettings() {
  const setIsSettingsOpen = useSetAtom(settingsOpenAtom);
  return (
    <button type="button" title="Settings" className={baseButtonClasses} onClick={() => setIsSettingsOpen((p) => !p)}>
      <Settings2 className="size-5" />
    </button>
  );
}

function compressExported(exportedProject: object) {
  const compressed = compress(exportedProject);
  return gzip(JSON.stringify(compressed)) as Promise<Uint8Array<ArrayBuffer>>;
}

export default function SettingsDialog() {
  const [open, setOpen] = useAtom(settingsOpenAtom);
  const [executingAction, setExecutingAction] = useState<false | "export" | "share" | "delete">(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareLink, setSharelink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [currentProject, setCurrentProject] = useAtom(currentProjectAtom);
  const [title, setTitle] = useDebouncedUpdate(currentProject.id, currentProject.title, 150, (v) =>
    setCurrentProject((p) => ({ ...p, title: v })),
  );

  async function exportProject() {
    const db = await openFileDB();
    const files: Record<string, Record<string, unknown>> = {};

    for (const item of currentProject.items) {
      if (!("src" in item) || typeof item.src !== "string" || !item.src.startsWith("upload:")) continue;

      const store = item.src.split(":")[1];
      const tx = db.transaction(store, "readonly");
      if (!files[store]) files[store] = {};
      files[store][item.src] = await tx.store.get(item.src);
    }

    return {
      type: "organote",
      version: 4,
      project: {
        ...currentProject,
        offset: { x: 0, y: 0, z: 1 },
      },
      files,
    };
  }

  return (
    <div
      data-visible={open}
      className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 flex h-dvh w-dvw cursor-default items-center justify-center backdrop-blur-xl transition-all data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      onClick={() => setOpen(false)}
      onKeyDown={() => {}}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
        className="flex min-h-64 w-full max-w-xl flex-col justify-between gap-2 rounded-lg border bg-background p-4"
      >
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-2xl">Settings</h3>
          <b className="-mb-2">Title</b>
          <Input type="text" placeholder="Project title" onChange={(e) => setTitle(e.target.value)} value={title} />
          <b className="-mb-2">Export</b>
          <div className="flex gap-2">
            <Button
              disabled={!!executingAction}
              onClick={async () => {
                setExecutingAction("export");
                const a = document.createElement("a");
                const exported = await exportProject();
                const compressed = await compressExported(exported);
                const blob = new Blob([compressed], {
                  type: "application/gzip",
                });
                a.href = URL.createObjectURL(blob);
                a.download = `${currentProject.title || currentProject.id}.note.gz`;
                a.click();
                setExecutingAction(false);
              }}
              variant="secondary"
            >
              <Download />
              Export{executingAction === "export" && "ing"} project
            </Button>
            <Button
              disabled={!!executingAction}
              onClick={async () => {
                if (shareLink) {
                  window.navigator.clipboard.writeText(shareLink);
                  setIsCopied(true);
                  return;
                }
                setExecutingAction("share");
                const exported = await exportProject();
                const compressed = await compressExported(exported);
                const key = await generateEncryptionKey();
                const { encrypted, iv } = await encryptData(key, compressed);
                const combinedBuffer = concatBuffers(iv, new Uint8Array(encrypted));
                try {
                  const { pathname } = await upload(currentProject.id, Buffer.from(combinedBuffer), {
                    access: "public",
                    handleUploadUrl: "/api/store",
                    contentType: "application/gzip",
                    multipart: true,
                    onUploadProgress: (e) => setUploadProgress(e.percentage),
                  });
                  setSharelink(`${location.origin}/#s=${pathname},${key}`);
                } catch {}
                setExecutingAction(false);
              }}
              className="relative overflow-hidden"
              variant="secondary"
            >
              {shareLink ? (
                <>
                  <Copy data-copied={isCopied} className="transition-all duration-300 data-[copied=false]:opacity-50" />
                  {isCopied ? "Copied!" : "Click to copy link"}
                </>
              ) : (
                <>
                  <UploadCloud />
                  {executingAction === "share" ? "Uploading" : "Share"} project
                  <div
                    className="pointer-events-none absolute right-full h-24 w-[calc(100%+3px)] mix-blend-difference transition-all duration-300 ease-out"
                    style={{
                      translate: `${uploadProgress - 1}% 0%`,
                    }}
                  >
                    <div className="size-full rotate-6 bg-white" />
                  </div>
                </>
              )}
            </Button>
          </div>
          <b className="-mb-2">Enabled plugins</b>
          <PluginToggler />
        </div>
        <footer className="flex items-center justify-between gap-2">
          <Button
            variant="destructive"
            disabled={!!executingAction}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this project?")) {
                setExecutingAction("delete");
                const nextProject = getProjects()
                  .filter((p) => p.id !== currentProject.id)
                  .shift();
                for (const item of currentProject.items) {
                  if ("src" in item && typeof item.src === "string" && item.src.startsWith("upload:")) {
                    deleteResource(item.src);
                  }
                }
                localStorage.removeItem(`project-${currentProject.id}`);
                const params = new URLSearchParams();
                params.set("i", nextProject?.id ?? nanoid(7));
                window.history.replaceState(null, "", `?${params.toString()}`);
                setExecutingAction(false);
                setOpen(false);
              }
            }}
          >
            Delet{executingAction === "delete" ? "ing" : "e"} project
          </Button>
          <Button onClick={() => setOpen(false)}>Exit</Button>
        </footer>
      </div>
    </div>
  );
}

function PluginToggler() {
  const enabledPlugins = useEnabledPlugins();
  return plugins
    .filter((p) => !p.isRequired)
    .map((p) => (
      <div key={p.name} className="items-top flex space-x-2">
        <Checkbox
          id={p.name}
          checked={enabledPlugins.includes(p.name)}
          onCheckedChange={(e) =>
            enabledPlugins.set((prev) => (e ? prev.concat(p.name) : prev.filter((n) => n !== p.name)))
          }
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={p.name}
            className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {p.displayName ?? p.name}
          </label>
          <p className="text-muted-foreground text-sm">{p.description}</p>
        </div>
      </div>
    ));
}
