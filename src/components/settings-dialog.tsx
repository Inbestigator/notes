"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { Project } from "./project-provider";
import { memo, useEffect, useState } from "react";

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
      className="absolute top-1/2 left-1/2 flex h-dvh w-dvw -translate-x-1/2 -translate-y-1/2 items-center justify-center backdrop-blur-xl transition-all data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
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
