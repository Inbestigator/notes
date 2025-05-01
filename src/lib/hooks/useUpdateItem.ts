import { BaseItem } from "@/components/items";
import { useSetAtom } from "jotai";
import { itemsAtom } from "../state";

export default function useUpdateItem(id: string) {
  const setItems = useSetAtom(itemsAtom);

  return (item: unknown | ((prev: BaseItem) => unknown)) => {
    setItems((prev) => {
      const prevItem = { ...prev.find((i) => i.id === id) };
      if (!prevItem.id) return prev;
      if (typeof item === "function") {
        item = item(prev);
      }
      return [
        ...prev.filter((i) => i.id !== id),
        { ...prevItem, ...(item as BaseItem) },
      ];
    });
  };
}
