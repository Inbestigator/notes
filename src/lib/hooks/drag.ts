import { useCallback, useEffect, useRef, useState } from "react";

export default function useDrag(
  startOffset: { x: number; y: number },
  onDragEnd: (offset: { x: number; y: number }) => void,
) {
  const [localOffset, setLocalOffset] = useState(startOffset);
  const [isDragging, setIsDragging] = useState(false);
  const localOffsetRef = useRef(localOffset);

  useEffect(() => {
    localOffsetRef.current = localOffset;
  }, [localOffset]);

  const handleMouseDown = useCallback(
    (mde: React.MouseEvent) => {
      const handleMouseMove = (mme: MouseEvent) => {
        const target = mde.target as HTMLDivElement;
        const newOffset = {
          x:
            (mme.clientX - window.offset.x) / window.offset.z -
            target.offsetLeft -
            target.offsetWidth / 2,
          y:
            (mme.clientY - window.offset.y) / window.offset.z -
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
    },
    [onDragEnd],
  );

  return {
    localOffset,
    isDragging,
    handleMouseDown,
  };
}
