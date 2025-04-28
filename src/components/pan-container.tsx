"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useProject } from "./project-provider";

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
  const { setCurrentProject, initialOffset } = useProject();
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hasStarted, setHasStarted] = useState(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout>(null);
  const isMiddleClicking = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number }>(null);

  useEffect(() => {
    setOffset(initialOffset);
  }, [initialOffset]);

  useEffect(() => {
    setCurrentProject((prev) => ({
      ...prev,
      offset,
    }));
  }, [offset, setCurrentProject]);

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

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const elUnderPointer = document.elementFromPoint(
        touch.clientX,
        touch.clientY,
      );
      if (elUnderPointer?.hasAttribute("data-pannable")) {
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (lastMousePos.current && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePos.current.x;
      const dy = touch.clientY - lastMousePos.current.y;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastMousePos.current = null;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("mousedown", handleMouseUpDown);
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseup", handleMouseUpDown);
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("mousedown", handleMouseUpDown);
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseup", handleMouseUpDown);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    handleWheel,
    handleMouseUpDown,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return (
    <PanContext.Provider value={{ offset, setOffset }}>
      <div
        data-pannable
        ref={containerRef}
        className="absolute inset-0 cursor-move touch-none overflow-hidden bg-[size:32px] bg-clip-border" // touch-none prevents browser from interfering
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
