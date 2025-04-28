import useDrag from "@/lib/hooks/drag";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import { memo } from "react";
import { useProject } from "./project-provider";

const ItemWrapper = memo(function ItemWrapper({
  id,
  children,
  className,
  tabClassName,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  tabClassName?: ClassValue;
}) {
  const { currentProject } = useProject();
  const { isDragging, localOffset, handleMouseDown } = useDrag(
    currentProject.items[id].offset,
    (offset) =>
      window.dispatchEvent(
        new CustomEvent("itemUpdate", { detail: { id, partial: { offset } } }),
      ),
  );

  return (
    <div
      style={{ transform: `translate(${localOffset.x}px, ${localOffset.y}px)` }}
      className={cn(
        "group absolute cursor-default overflow-hidden rounded-sm shadow-lg transition-none duration-300 ease-in-out [transition:border-radius_150ms_cubic-bezier(0.4,0,0.2,1)] hover:rounded-br-4xl",
        isDragging && "pointer-events-none opacity-90 select-none",
        className,
      )}
    >
      {children}
      {["top-0 left-0", "top-0 right-0", "bottom-0 left-0"].map((p) => (
        <div
          key={p}
          onMouseDown={handleMouseDown}
          className={cn(
            "pointer-events-auto absolute z-10 size-4 cursor-grab",
            p,
          )}
        />
      ))}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "pointer-events-auto absolute right-0 bottom-0 z-10 size-6 translate-full cursor-grab rounded-tl-sm shadow-md transition-all duration-300 ease-in-out group-hover:translate-0 group-hover:-skew-6 hover:not-active:size-7 hover:not-active:-skew-3 active:cursor-grabbing",
          tabClassName,
        )}
      />
    </div>
  );
});

export default ItemWrapper;
