import { usePanOffset } from "@/components/pan-container";
import { useEffect, useRef, useState } from "react";

export default function useDrag(
  startOffset: { x: number; y: number },
  onDragEnd: (offset: { x: number; y: number }) => void,
) {
  const [localOffset, setLocalOffset] = useState(startOffset);
  const [isDragging, setIsDragging] = useState(false);
  const localOffsetRef = useRef(localOffset);
  const globalOffset = usePanOffset();

  useEffect(() => {
    localOffsetRef.current = localOffset;
  }, [localOffset]);

  const handleMouseDown = (mde: React.MouseEvent) => {
    const handleMouseMove = (mme: MouseEvent) => {
      const target = mde.target as HTMLDivElement;
      const newOffset = {
        x:
          mme.clientX -
          globalOffset.x -
          target.offsetLeft -
          target.offsetWidth / 2,
        y:
          mme.clientY -
          globalOffset.y -
          target.offsetTop -
          target.offsetHeight / 2,
      };
      setLocalOffset(newOffset);
    };

    const handleMouseUp = () => {
      onDragEnd(localOffsetRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    setIsDragging(true);
  };

  return {
    localOffset,
    isDragging,
    handleMouseDown,
  };
}
