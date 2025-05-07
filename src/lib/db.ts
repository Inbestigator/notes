import { openDB } from "idb";

export async function openFileDB() {
  return openDB("files", 2, {
    upgrade(db) {
      const stores = ["images", "pdfs"];
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      }
    },
  });
}
