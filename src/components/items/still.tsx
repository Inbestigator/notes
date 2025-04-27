"use client";

import type { Still } from "../items";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import NextImage from "next/image";
import Sheet from "./paper";

interface ImageData {
  type: string;
  name: string;
  src: string;
}

export default function Still({
  id,
  item,
  placeholderTitle,
}: {
  id: string;
  item: Still;
  placeholderTitle?: string;
}) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const debouncedTitle = useDebouncedCallback((title) => {
    window.dispatchEvent(
      new CustomEvent("itemUpdate", {
        detail: { id, partial: { title } },
      }),
    );
  }, 150);

  useEffect(() => {
    async function fetchImage() {
      const db = await openFileDB();
      const storedImage = await new Promise<ImageData>((resolve, reject) => {
        const transaction = db.transaction("images", "readonly");
        const store = transaction.objectStore("images");
        const request = store.get(item.src);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

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

            const base64 = canvas.toDataURL(mimeType);
            const uuid = crypto.randomUUID();

            const db = await openFileDB();
            db.transaction("images", "readwrite")
              .objectStore("images")
              .put({ type: mimeType, src: base64, name }, `file-${uuid}`);

            window.dispatchEvent(
              new CustomEvent("itemUpdate", {
                detail: { id, partial: { src: `file-${uuid}` } },
              }),
            );
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
            className="size-96 object-contain"
          />
        )}
      </div>
      <input
        type="text"
        className="mt-4 w-full text-xl font-medium outline-none"
        placeholder={placeholderTitle ?? imageData?.name ?? "A photo of..."}
        onChange={(e) => debouncedTitle(e.target.value)}
        defaultValue={item.title}
      />
    </Sheet>
  );
}

async function openFileDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("files", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
