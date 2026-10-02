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

const draftPrefix = "genertter-post-draft-v1:";

function draftKeysForUser(userId: number) {
  const prefix = `${draftPrefix}${userId}:`;
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index++) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

async function imageDraftKeysForUser(userId: number): Promise<string[]> {
  const database = await openDraftDatabase();
  const prefix = `${draftPrefix}${userId}:`;
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(imageStoreName, "readonly");
    const request = transaction.objectStore(imageStoreName).getAllKeys();
    request.onsuccess = () => resolve(request.result.filter((key): key is string => typeof key === "string" && key.startsWith(prefix)));
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
    transaction.onabort = () => { database.close(); reject(transaction.error); };
  });
}

async function sameImages(left: File[], right: File[]) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    const source = left[index];
    const target = right[index];
    if (source.name !== target.name || source.size !== target.size ||
        source.type !== target.type || source.lastModified !== target.lastModified) return false;
    const [sourceBytes, targetBytes] = await Promise.all([source.arrayBuffer(), target.arrayBuffer()]);
    const sourceView = new Uint8Array(sourceBytes);
    const targetView = new Uint8Array(targetBytes);
    if (sourceView.some((byte, byteIndex) => byte !== targetView[byteIndex])) return false;
  }
  return true;
}

/** 元の下書きを残したままコピーする。衝突時はどちらも上書きしない。 */
export async function copyPostDraftsForUpgrade(guestUserId: number, googleUserId: number) {
  if (guestUserId === googleUserId) return;
  const guestPrefix = `${draftPrefix}${guestUserId}:`;
  const guestImageKeys = await imageDraftKeysForUser(guestUserId);
  const googleImageKeys = new Set(await imageDraftKeysForUser(googleUserId));
  const guestKeys = [...new Set([...draftKeysForUser(guestUserId), ...guestImageKeys])];
  const planned: { source: string; target: string; text: string | null; images: File[] }[] = [];

  for (const source of guestKeys) {
    const target = `${draftPrefix}${googleUserId}:${source.slice(guestPrefix.length)}`;
    const text = window.localStorage.getItem(source);
    const existingText = window.localStorage.getItem(target);
    if (text !== null && existingText !== null && text !== existingText) {
      throw new Error("ゲストとGoogle側に同じ投稿先の文章下書きがあります。どちらかを投稿・削除してから再試行してください。");
    }
    const images = guestImageKeys.includes(source) ? await readDraftImages(source) : [];
    if ((text === null && images.length > 0 && existingText !== null) ||
        (text !== null && images.length === 0 && googleImageKeys.has(target))) {
      throw new Error("ゲストとGoogle側に同じ投稿先の下書きがあります。どちらかを投稿・削除してから再試行してください。");
    }
    if (images.length && googleImageKeys.has(target)) {
      const existingImages = await readDraftImages(target);
      if (!await sameImages(images, existingImages)) {
        throw new Error("ゲストとGoogle側に同じ投稿先の画像下書きがあります。どちらかを投稿・削除してから再試行してください。");
      }
    }
    planned.push({ source, target, text, images });
  }

  for (const draft of planned) {
    if (draft.text !== null && window.localStorage.getItem(draft.target) === null) {
      window.localStorage.setItem(draft.target, draft.text);
    }
    if (draft.images.length && !googleImageKeys.has(draft.target)) {
      await saveDraftImages(draft.target, draft.images);
    }
  }
}

/** DB 引き継ぎに成功した後だけ元の下書きを片付ける。コピー先は変更しない。 */
export async function removeGuestPostDrafts(guestUserId: number) {
  const textKeys = draftKeysForUser(guestUserId);
  const imageKeys = await imageDraftKeysForUser(guestUserId);
  for (const key of textKeys) window.localStorage.removeItem(key);
  for (const key of imageKeys) await saveDraftImages(key, []);
}
