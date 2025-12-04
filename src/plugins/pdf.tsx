"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { openFileDB } from "@/lib/db";
import useUpdateItem from "@/lib/hooks/useUpdateItem";
import { cn } from "@/lib/utils";
import type { BaseItem } from "../components/items";
import Sheet from "../components/primitives/paper";
import type { Plugin } from ".";

// TODO: Convert to react-pdf (probably)

interface Pdf extends BaseItem {
  src: string;
}

interface PdfData {
  type: string;
  name: string;
  src: string;
}

export default {
  name: "pdf",
  displayName: "Unstable - PDF",
  description: "Display PDF files. Works but exports don't include file",
  defaultProps: { src: "" },
  dimensions: { width: 576, height: 680 },
  HudComponent: ({ variant }) => <FileText className={cn("size-5", variant === 2 && "fill-red-300")} />,
  RenderedComponent,
} satisfies Plugin<Pdf>;

function RenderedComponent({ id, item }: { id: string; item: Pdf }) {
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const setItem = useUpdateItem(id);
  useEffect(() => {
    let blobUrl: string;
    async function fetchPdf() {
      if (!item?.src) return;

      const db = await openFileDB();
      const tx = db.transaction("pdfs", "readonly");
      const storedPdf = await tx.store.get(item.src);

      if (storedPdf?.blob) {
        blobUrl = URL.createObjectURL(storedPdf.blob);
        setPdfData({
          ...storedPdf,
          src: blobUrl,
        });
      }
    }

    fetchPdf();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [item.src]);

  return (
    <Sheet id={id}>
      <div
        className="h-160 w-xl rounded-xs bg-neutral-800"
        onDrop={async (e) => {
          e.preventDefault();

          const file = e.dataTransfer.files[0];
          if (!file || file.type !== "application/pdf") return;

          const arrayBuffer = await file.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: file.type });

          const db = await openFileDB();
          const tx = db.transaction("pdfs", "readwrite");
          const id = `upload:pdfs:${crypto.randomUUID()}`;

          await tx.store.add({ name: file.name, type: file.type, blob }, id);

          setItem({ src: id });
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {pdfData && (
          <iframe
            src={`${pdfData.src}#toolbar=0`}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="PDF preview"
          />
        )}
      </div>
    </Sheet>
  );
}
