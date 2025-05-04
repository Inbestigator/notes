"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { currentProjectAtom, settingsOpenAtom } from "@/lib/state";
import { useState } from "react";
import { Copy, Download, Settings2, UploadCloud } from "lucide-react";
import { openFileDB } from "@/lib/db";
import {
  concatBuffers,
  encryptData,
  generateEncryptionKey,
} from "@/lib/encryption";
import { upload } from "@vercel/blob/client";
import { useDebouncedCallback } from "use-debounce";
import { useAtom, useSetAtom } from "jotai";
import { baseButtonClasses } from "./hud";
import { getProjects } from "./project-manager";
import { nanoid } from "nanoid";
import { gzip } from "node-gzip";
import { compress } from "compress-json";
import { Checkbox } from "./ui/checkbox";
import { useSearchParams } from "next/navigation";
import plugins from "@/plugins";

export function OpenSettings() {
  const setIsSettingsOpen = useSetAtom(settingsOpenAtom);
  return (
    <button
      title="Settings"
      className={baseButtonClasses}
      onClick={() => setIsSettingsOpen((p) => !p)}
    >
      <Settings2 className="size-5" />
    </button>
  );
}

function compressExported(exportedProject: object) {
  const compressed = compress(exportedProject);
  return gzip(JSON.stringify(compressed));
}

export default function SettingsDialog() {
  const [open, setOpen] = useAtom(settingsOpenAtom);
  const [executingAction, setExecutingAction] = useState<
    false | "export" | "share" | "delete"
  >(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareLink, setSharelink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [currentProject, setCurrentProject] = useAtom(currentProjectAtom);
  const debouncedTitle = useDebouncedCallback(
    (title) => setCurrentProject({ ...currentProject, title }),
    150,
  );

  async function exportProject() {
    const db = await openFileDB();
    const files: Record<string, Record<string, unknown>> = {};

    for (const item of currentProject.items) {
      if (
        !("src" in item) ||
        typeof item.src !== "string" ||
        !item.src.startsWith("upload:")
      )
        continue;

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
      className="absolute top-1/2 left-1/2 flex h-dvh w-dvw -translate-x-1/2 -translate-y-1/2 cursor-default items-center justify-center backdrop-blur-xl transition-all data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background flex min-h-64 w-full max-w-xl flex-col justify-between gap-2 rounded-lg border p-4"
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-semibold">Settings</h3>
          <b className="-mb-2">Title</b>
          <Input
            type="text"
            placeholder="Project title"
            onChange={(e) => debouncedTitle(e.target.value)}
            defaultValue={currentProject.title}
          />
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
                a.download = `${currentProject.title?.length ? currentProject.title : currentProject.id}.note.gz`;
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
                const combinedBuffer = concatBuffers(
                  iv,
                  new Uint8Array(encrypted),
                );
                try {
                  const { pathname } = await upload(
                    currentProject.id,
                    Buffer.from(combinedBuffer),
                    {
                      access: "public",
                      handleUploadUrl: "/api/store",
                      multipart: true,
                      onUploadProgress: (e) => setUploadProgress(e.percentage),
                    },
                  );
                  setSharelink(location.origin + `/#s=${pathname},${key}`);
                } catch {}
                setExecutingAction(false);
              }}
              className="relative overflow-hidden"
              variant="secondary"
            >
              {shareLink ? (
                <>
                  <Copy
                    data-copied={isCopied}
                    className="transition-all duration-300 data-[copied=false]:opacity-50"
                  />
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
              if (
                window.confirm("Are you sure you want to delete this project?")
              ) {
                setExecutingAction("delete");
                const nextProject = getProjects()
                  .filter((p) => p.id !== currentProject.id)
                  .shift();
                localStorage.removeItem("project-" + currentProject.id);
                const params = new URLSearchParams();
                params.set("i", nextProject?.id ?? nanoid(7));
                nextProject?.plugins.forEach((p) => params.set("p:" + p, ""));
                window.history.replaceState(null, "", "?" + params.toString());
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
  const params = useSearchParams();

  return plugins
    .filter((p) => !p.isRequired)
    .map((p) => (
      <div key={p.name} className="flex items-center space-x-2">
        <Checkbox
          id={p.name}
          checked={params.has("p:" + p.name)}
          onCheckedChange={(e) => {
            const params = new URLSearchParams(window.location.search);
            if (e) {
              params.set("p:" + p.name, "");
            } else {
              params.delete("p:" + p.name);
            }
            window.history.replaceState(null, "", "?" + params.toString());
          }}
        />
        <label
          htmlFor="terms"
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {p.displayName ?? p.name}
        </label>
      </div>
    ));
}
