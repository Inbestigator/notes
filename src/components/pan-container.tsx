"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

const PanContext = createContext(
  {} as {
    offset: { x: number; y: number };
    setOffset: (offset: { x: number; y: number }) => void;
  },
);

export function usePanOffset() {
  return useContext(PanContext).offset;
}
export function useSetPanOffset() {
  return useContext(PanContext).setOffset;
}

export default function PanContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hasStarted, setHasStarted] = useState(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout>(null);
  const isMiddleClicking = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number }>(null);

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

  const handleMouseUpDown = useCallback((e: MouseEvent) => {
    if (e.button === 1) {
      isMiddleClicking.current = !isMiddleClicking.current;
      lastMousePos.current = isMiddleClicking.current
        ? { x: e.clientX, y: e.clientY }
        : null;
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isMiddleClicking.current && lastMousePos.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mousedown", handleMouseUpDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUpDown);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleMouseUpDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUpDown);
    };
  }, [handleWheel, handleMouseUpDown, handleMouseMove]);

  return (
    <PanContext.Provider value={{ offset, setOffset }}>
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
