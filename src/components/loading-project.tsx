"use client";

import { useAtomValue } from "jotai";
import { loadingProjectAtom } from "@/lib/state";

export default function Loading() {
  const isLoading = useAtomValue(loadingProjectAtom);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-999 animate-pulse bg-[size:32px] bg-clip-border"
      style={{
        backgroundImage: "url('/dots.png')",
        willChange: "background-position",
      }}
    />
  );
}
