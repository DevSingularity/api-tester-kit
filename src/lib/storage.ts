import { get, set, del, keys } from "idb-keyval";

const PREFIX = "api-tester:";

export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await set(`${PREFIX}${key}`, value);
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
}

export async function loadFromStorage<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(`${PREFIX}${key}`);
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return undefined;
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    await del(`${PREFIX}${key}`);
  } catch (error) {
    console.error(`Failed to remove ${key}:`, error);
  }
}

export async function clearStorage(): Promise<void> {
  try {
    const allKeys = await keys();
    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith(PREFIX)) {
        await del(key);
      }
    }
  } catch (error) {
    console.error("Failed to clear storage:", error);
  }
}

export async function getAllKeys(): Promise<string[]> {
  try {
    const allKeys = await keys();
    return allKeys
      .filter((k): k is string => typeof k === "string" && k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length));
  } catch (error) {
    console.error("Failed to get keys:", error);
    return [];
  }
}
