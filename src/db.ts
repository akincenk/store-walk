import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Walk } from "./model";

interface StoreWalkDB extends DBSchema {
  walks: { key: string; value: Walk; indexes: { startedAt: string } };
}

let dbPromise: Promise<IDBPDatabase<StoreWalkDB>> | undefined;

function db() {
  dbPromise ??= openDB<StoreWalkDB>("store-walk", 1, {
    upgrade(d) {
      d.createObjectStore("walks", { keyPath: "id" }).createIndex("startedAt", "startedAt");
    },
  });
  return dbPromise;
}

export async function saveWalk(walk: Walk): Promise<void> {
  await (await db()).put("walks", walk);
}

export async function getWalk(id: string): Promise<Walk | undefined> {
  return (await db()).get("walks", id);
}

/** All walks, newest first. */
export async function listWalks(): Promise<Walk[]> {
  return (await (await db()).getAllFromIndex("walks", "startedAt")).reverse();
}

export async function deleteWalk(id: string): Promise<void> {
  await (await db()).delete("walks", id);
}
