import type { ClassValue } from "clsx";
import { useAtomValue } from "jotai";
import { useState } from "react";
import useDeleteItem from "@/lib/hooks/useDeleteItem";
import useUpdateItem from "@/lib/hooks/useUpdateItem";
import { deleteModeAtom, offsetAtom, zoomAtom } from "@/lib/state";
import { cn } from "@/lib/utils";
import { useItemOffset } from "./items";

function ItemWrapper({
  id,
  children,
  className,
  tabClassName,
  ...props
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  tabClassName?: ClassValue;
} & React.HTMLAttributes<HTMLDivElement>) {
  const offset = useItemOffset(id);
  const [isDragging, setIsDragging] = useState(false);
  const setItem = useUpdateItem(id);
  const globalOffset = useAtomValue(offsetAtom);
  const zoom = useAtomValue(zoomAtom);
  const deleteItem = useDeleteItem(id);
  const isDeleting = useAtomValue(deleteModeAtom);

  function handleMouseDown(mde: React.MouseEvent) {
    const handleMouseMove = (mme: MouseEvent) => {
      const target = mde.target as HTMLDivElement;
      const newOffset = {
        x: (mme.clientX - globalOffset.x) / zoom - target.offsetLeft - target.offsetWidth / 2,
        y: (mme.clientY - globalOffset.y) / zoom - target.offsetTop - target.offsetHeight / 2,
      };
      setItem({ offset: newOffset });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    setIsDragging(true);
  }

  return (
    <div
      {...props}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
      tabIndex={isDeleting ? 0 : -1}
      className={cn(
        "group absolute cursor-default overflow-hidden rounded-sm shadow-lg transition-none duration-300 ease-in-out [transition:border-radius_150ms_cubic-bezier(0.4,0,0.2,1)] hover:rounded-br-4xl",
        isDragging && "pointer-events-none select-none opacity-90",
        isDeleting &&
          "after:absolute after:inset-0 after:z-50 after:cursor-pointer after:bg-red-600/30 not-hover:after:opacity-0! after:transition-all after:duration-300 hover:after:animate-pulse",
        className,
      )}
      onClick={() => {
        if (isDeleting) {
          deleteItem();
        }
      }}
      onKeyDown={(e) => {
        if (isDeleting && (e.key === "Enter" || e.key === " ")) {
          deleteItem();
        }
      }}
    >
      {children}
      {["top-0 left-0", "top-0 right-0", "bottom-0 left-0"].map((p) => (
        <div
          key={p}
          onMouseDown={handleMouseDown}
          className={cn("pointer-events-auto absolute z-10 size-4 cursor-grab", p)}
        />
      ))}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "translate-full group-hover:translate-0 group-hover:-skew-6 hover:not-active:-skew-3 pointer-events-auto absolute right-0 bottom-0 z-10 size-6 cursor-grab rounded-tl-sm shadow-md transition-all duration-300 ease-in-out hover:not-active:size-7 active:cursor-grabbing",
          tabClassName,
        )}
      />
    </div>
  );
}

export default ItemWrapper;
