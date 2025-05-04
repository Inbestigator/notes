"use client";

import type { BaseItem } from "../components/items";
import Sheet from "../components/primitives/paper";
import { PenTool } from "lucide-react";
import type { Plugin } from ".";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

interface Excalidraw extends BaseItem {
  state: Excalidraw;
}

export default {
  name: "excalidraw",
  displayName: "Unstable - Excalidraw",
  dimensions: { width: 672, height: 384 },
  HudComponent: () => <PenTool className="size-5" />,
  RenderedComponent,
} as Plugin<Excalidraw>;

function RenderedComponent({ id }: { id: string; item: Excalidraw }) {
  return (
    <Sheet id={id} className="h-96 w-2xl">
      <Excalidraw />
    </Sheet>
  );
}
