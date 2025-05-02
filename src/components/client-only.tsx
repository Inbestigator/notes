"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const ClientOnly = ({ children }: { children: React.ReactNode }) => children;

export default dynamic(() => Promise.resolve(ClientOnly), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[size:32px] bg-clip-border"
      style={{
        backgroundImage: "url('/dots.png')",
        willChange: "background-position",
      }}
    >
      <Loader2 className="text-muted size-16 animate-spin" />
    </div>
  ),
});
