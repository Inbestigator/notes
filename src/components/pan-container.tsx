"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { offsetAtom } from "@/lib/state";
import { useAtom } from "jotai";

export default function PanContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useAtom(offsetAtom);
  const [hasStarted, setHasStarted] = useState(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout>(null);
  const isMiddleClicking = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number }>(null);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!containerRef.current) return;

      const isZooming = e.ctrlKey;

      if (!isZooming) {
        const elUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
        if (!elUnderPointer?.hasAttribute("data-pannable") && !hasStarted)
          return;
        setHasStarted(true);
        e.preventDefault();

        setOffset((prev) => ({
          x: prev.x - e.deltaX / 1.25,
          y: prev.y - e.deltaY / 1.25,
          z: prev.z,
        }));

        if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = setTimeout(() => setHasStarted(false), 150);
      } else {
        e.preventDefault();
        const zoomFactor = 0.005;
        const newScale = Math.min(
          2,
          Math.max(0.25, offset.z * (1 - e.deltaY * zoomFactor)),
        );

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (newScale === offset.z) return;

        setOffset((prevOffset) => {
          const worldX = (mouseX - prevOffset.x) / prevOffset.z;
          const worldY = (mouseY - prevOffset.y) / prevOffset.z;

          const newOffsetX = mouseX - worldX * newScale;
          const newOffsetY = mouseY - worldY * newScale;

          return { x: newOffsetX, y: newOffsetY, z: newScale };
        });
      }
    },
    [hasStarted, offset.z, setOffset],
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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isMiddleClicking.current && lastMousePos.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;

        setOffset((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
          z: prev.z,
        }));

        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [setOffset],
  );

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

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (lastMousePos.current && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - lastMousePos.current.x;
        const dy = touch.clientY - lastMousePos.current.y;

        setOffset((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
          z: prev.z,
        }));

        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [setOffset],
  );

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
    <div
      data-pannable
      ref={containerRef}
      className="absolute inset-0 cursor-move touch-none overflow-hidden bg-clip-border"
      style={{
        backgroundPosition: `${offset.x}px ${offset.y}px`,
        backgroundSize: `${32 * offset.z}px`,
        backgroundImage: "url('/dots.png')",
        willChange: "background-position",
      }}
    >
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${offset.z})`,
          willChange: "transform",
        }}
        className="size-full origin-top-left"
        data-pannable
      >
        {children}
      </div>
    </div>
  );
}
