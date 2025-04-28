"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { Project } from "./project-provider";
import { memo, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { openFileDB } from "@/lib/db";

export default memo(function SettingsDialog({
  open,
  setOpen,
  offset,
  project,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  offset: { x: number; y: number };
  project?: Project;
}) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle(project?.title ?? "");
  }, [project]);

  if (!project) return null;

  return (
    <div
      data-visible={open}
      style={{ transform: `translate(${-offset.x}px, ${-offset.y}px)` }}
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
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />
          <Button
            onClick={async () => {
              const a = document.createElement("a");
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
              const blob = new Blob(
                [
                  JSON.stringify({
                    type: "organote",
                    version: 2,
                    project,
                    files,
                  }),
                ],
                {
                  type: "application/json",
                },
              );
              a.href = URL.createObjectURL(blob);
              a.download = `${project.title?.length ? project.title : project.id}.note`;
              a.click();
            }}
            className="w-fit"
            variant="secondary"
          >
            <Download />
            Export project
          </Button>
        </div>
        <footer className="flex items-end justify-end">
          <Button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("projectUpdate", {
                  detail: { id: project?.id, partial: { title } },
                }),
              );
              setOpen(!open);
            }}
          >
            Save changes
          </Button>
        </footer>
      </div>
    </div>
  );
});
