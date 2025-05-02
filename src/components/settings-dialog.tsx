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

export default function SettingsDialog() {
  const [open, setOpen] = useAtom(settingsOpenAtom);
  const [executingAction, setExecutingAction] = useState<
    false | "export" | "share" | "delete"
  >(false);
  const [shareLink, setSharelink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [currentProject, setCurrentProject] = useAtom(currentProjectAtom);
  const debouncedTitle = useDebouncedCallback(
    (title) => setCurrentProject({ ...currentProject, title }),
    150,
  );

  async function exportProject() {
    const project = getProjects().find((p) => p.id === currentProject.id);

    if (!project) return;

    const db = await openFileDB();
    const files: Record<string, Record<string, unknown>> = {};

    for (const store of db.objectStoreNames) {
      const tx = db.transaction(store, "readonly");
      const filesOfType: Record<string, unknown> = {};
      const allKeys = await tx.store.getAllKeys();
      for (const key of allKeys) {
        filesOfType[key.toString()] = await tx.store.get(key);
      }
      files[store] = filesOfType;
    }

    return {
      type: "organote",
      version: 3,
      project: {
        ...project,
        offset: { x: 0, y: 0, z: 1 },
      },
      items: project.items,
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
        className="bg-background flex min-h-64 w-full max-w-xl flex-col justify-between rounded-lg border p-4"
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-semibold">Settings</h3>
          <b className="text-muted-foreground -mb-2">Title</b>
          <Input
            type="text"
            placeholder="Project title"
            onChange={(e) => debouncedTitle(e.target.value)}
            defaultValue={currentProject.title}
          />
          <div className="flex gap-2">
            <Button
              disabled={!!executingAction}
              onClick={async () => {
                setExecutingAction("export");
                const a = document.createElement("a");
                const exported = await exportProject();
                const blob = new Blob([JSON.stringify(exported)], {
                  type: "application/json",
                });
                a.href = URL.createObjectURL(blob);
                a.download = `${currentProject.title?.length ? currentProject.title : currentProject.id}.note`;
                a.click();
                setExecutingAction(false);
              }}
              className="w-fit"
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
                const key = await generateEncryptionKey();
                const { encrypted, iv } = await encryptData(
                  key,
                  JSON.stringify(exported),
                );
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
                    },
                  );
                  setSharelink(location.origin + `/#s=${pathname},${key}`);
                } catch {}
                setExecutingAction(false);
              }}
              className="group"
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
                </>
              )}
            </Button>
          </div>
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
                localStorage.removeItem("project-" + currentProject.id);
                window.location.replace("/");
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
