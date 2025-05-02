"use client";

import { loadingProjectAtom } from "@/lib/state";
import { useAtomValue } from "jotai";

export default function Loading() {
  const isLoading = useAtomValue(loadingProjectAtom);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="pulse absolute inset-0 z-999 bg-[size:32px] bg-clip-border"
      style={{
        backgroundImage: "url('/dots.png')",
        willChange: "background-position",
      }}
    />
  );
}
