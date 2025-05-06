import { useAtomValue, useSetAtom } from "jotai";
import { itemFamilyAtom, itemsAtom } from "../state";
import { openFileDB } from "../db";

export async function deleteResource(src: string) {
  const db = await openFileDB();
  const store = src.split(":")[1];
  const tx = db.transaction(store, "readwrite");
  await tx.store.delete(src);
}

export default function useDeleteItem(id: string) {
  const item = useAtomValue(itemFamilyAtom(id));
  const setItems = useSetAtom(itemsAtom);

  return () => {
    if (
      "src" in item &&
      typeof item.src === "string" &&
      item.src.startsWith("upload:")
    ) {
      deleteResource(item.src);
    }
    itemFamilyAtom.remove(id);
    setItems((p) => p.filter((i) => i.id !== id));
  };
}
