import { openDB } from "idb";

export async function openFileDB() {
  return openDB("files", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    },
  });
}
