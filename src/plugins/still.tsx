"use client";

import type { BaseItem } from "../components/items";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import Sheet from "../components/primitives/paper";
import { openFileDB } from "@/lib/db";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plugin } from ".";
import useUpdateItem from "@/lib/hooks/useUpdateItem";
import useDebouncedUpdate from "@/lib/hooks/useDebouncedUpdate";

interface Still extends BaseItem {
  title: string;
  src: string;
}

interface ImageData {
  type: string;
  name: string;
  src: string;
}

export default {
  name: "still",
  displayName: "Image",
  isRequired: true,
  defaultProps: { title: "", src: "" },
  dimensions: { width: 416, height: 460 },
  HudComponent: ({ variant }) => (
    <ImageIcon className={cn("size-5", variant === 2 && "fill-red-300")} />
  ),
  RenderedComponent,
} as Plugin<Still>;

function RenderedComponent({ id, item }: { id: string; item: Still }) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const setItem = useUpdateItem(id);
  const [latestItemValue, updateItem] = useDebouncedUpdate(item.id, item);
  useEffect(() => {
    async function fetchImage() {
      const db = await openFileDB();
      const tx = db.transaction("images", "readonly");
      const storedImage = await tx.store.get(item.src);

      if (storedImage) {
        setImageData(storedImage);
      }
    }

    fetchImage();
  }, [item.src]);

  return (
    <Sheet id={id} className="p-4">
      <div
        className="size-96 rounded-xs bg-neutral-800"
        onDrop={async (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          const remoteUrl = e.dataTransfer.getData("URL");

          async function processImage(
            img: HTMLImageElement,
            mimeType: string,
            name: string,
          ) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const maxSize = 768;
            let { width, height } = img;
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const base64: string = canvas.toDataURL(mimeType);
            const imgId = "upload:images:" + crypto.randomUUID();

            const db = await openFileDB();
            const tx = db.transaction("images", "readwrite");

            await Promise.all([
              tx.store.add({ type: mimeType, src: base64, name }, imgId),
              tx.store.delete(item.src),
            ]);

            setItem({ src: imgId });
          }

          if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            const img = new Image();

            reader.onload = () => {
              if (typeof reader.result === "string") {
                img.onload = () => processImage(img, file.type, file.name);
                img.src = reader.result;
              }
            };
            reader.readAsDataURL(file);
          } else if (remoteUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () =>
              processImage(
                img,
                "image/png",
                new URL(remoteUrl).pathname.split("/").pop() ?? "image.png",
              );
            img.src = remoteUrl;
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {imageData && (
          <NextImage
            src={imageData.src}
            alt={imageData.name ?? item.title}
            width={384}
            height={384}
            className="size-96 rounded-xs object-contain"
          />
        )}
      </div>
      <input
        type="text"
        className="mt-4 w-full text-xl font-medium outline-none"
        placeholder={
          imageData?.name ? `A photo of ${imageData.name}` : "A photo of..."
        }
        onChange={(e) => updateItem({ title: e.target.value })}
        value={latestItemValue.title}
      />
    </Sheet>
  );
}
