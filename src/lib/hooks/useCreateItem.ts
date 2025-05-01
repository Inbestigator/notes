import { useAtomValue, useSetAtom } from "jotai";
import { highestZAtom, itemsAtom, offsetAtom } from "../state";
import { BaseItem } from "@/components/items";

export default function useCreateItem() {
  const setItems = useSetAtom(itemsAtom);
  const offset = useAtomValue(offsetAtom);
  const highestZ = useAtomValue(highestZAtom);

  return ({
    dimensions,
    ...item
  }: BaseItem & {
    dimensions?: { width: number; height: number };
  }) => {
    setItems((p) => [
      ...p,
      {
        ...item,
        offset: dimensions
          ? {
              x:
                -dimensions.width +
                (window.innerWidth - 52 - offset.x) / offset.z,
              y:
                -dimensions.height / 2 +
                (window.innerHeight / 2 - offset.y) / offset.z,
            }
          : { x: 0, y: 0 },
        z: highestZ + 1,
      },
    ]);
  };
}
