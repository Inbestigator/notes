"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

const PanContext = createContext({} as { x: number; y: number });
export function usePanOffset() {
  return useContext(PanContext);
}

export default function PanContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hasStarted, setHasStarted] = useState(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!containerRef.current) return;

      const elUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
      if (!elUnderPointer?.hasAttribute("data-pannable") && !hasStarted) return;

      setHasStarted(true);
      e.preventDefault();
      setOffset((prev) => ({
        x: prev.x - e.deltaX / 1.25,
        y: prev.y - e.deltaY / 1.25,
      }));

      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => setHasStarted(false), 150);
    },
    [hasStarted],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <PanContext.Provider value={offset}>
      <div
        data-pannable
        ref={containerRef}
        className="absolute inset-0 cursor-move overflow-hidden bg-[size:32px] bg-clip-border"
        style={{
          backgroundPosition: `${offset.x}px ${offset.y}px`,
          backgroundImage: "url('/dots.png')",
          willChange: "background-position",
        }}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            willChange: "transform",
          }}
          className="size-full"
          data-pannable
        >
          {children}
        </div>
      </div>
    </PanContext.Provider>
  );
}
