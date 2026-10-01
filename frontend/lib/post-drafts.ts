export type PostDraftText = {
  styleId: string;
  originalText: string;
  convertedText: string;
  hashtags: string;
};

const databaseName = "genertter-post-drafts";
const imageStoreName = "images";

export function postDraftKey(userId: number, parentPostId: number | null) {
  return `genertter-post-draft-v1:${userId}:${parentPostId ?? "new"}`;
}

export function readDraftText(key: string): PostDraftText | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") return null;
  const draft = value as Record<string, unknown>;
  if ([draft.styleId, draft.originalText, draft.convertedText, draft.hashtags].some((field) => typeof field !== "string")) return null;
  return draft as PostDraftText;
}

export function saveDraftText(key: string, draft: PostDraftText, hasImages: boolean) {
  if (draft.originalText || draft.convertedText || draft.hashtags || hasImages) {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } else {
    window.localStorage.removeItem(key);
  }
}

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("このブラウザでは画像の下書き保存を利用できません。"));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(imageStoreName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readDraftImages(key: string): Promise<File[]> {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(imageStoreName, "readonly");
    const request = transaction.objectStore(imageStoreName).get(key);
    request.onsuccess = () => {
      const value: unknown = request.result;
      resolve(Array.isArray(value) ? value.filter((item): item is File => item instanceof File) : []);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
    transaction.onabort = () => { database.close(); reject(transaction.error); };
  });
}

export async function saveDraftImages(key: string, images: File[]): Promise<void> {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(imageStoreName, "readwrite");
    const store = transaction.objectStore(imageStoreName);
    if (images.length) store.put(images, key);
    else store.delete(key);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
    transaction.onabort = () => { database.close(); reject(transaction.error); };
  });
}
