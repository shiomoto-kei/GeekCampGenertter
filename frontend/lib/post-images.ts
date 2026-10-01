export const MAX_POST_IMAGE_COUNT = 4;
export const MAX_SOURCE_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_POST_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const MAX_SOURCE_PIXELS = 40_000_000;
const MAX_OUTPUT_DIMENSION = 1600;
const WEBP_QUALITY = 0.8;

type DrawableImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

export function validatePostImage(file: File): string | null {
  if (!ALLOWED_POST_IMAGE_TYPES.includes(file.type)) {
    return "写真はJPEG・PNG・WebP・GIFから選んでください。";
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return "元の写真は1枚5MB以内にしてください。";
  }
  return null;
}

async function loadDrawable(file: File): Promise<DrawableImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
      image.src = objectUrl;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== "image/webp") {
        reject(new Error("このブラウザではWebPへの画像圧縮ができません。"));
        return;
      }
      resolve(blob);
    }, "image/webp", quality);
  });
}

async function isAnimatedWebp(file: File): Promise<boolean> {
  if (file.type !== "image/webp") return false;
  const header = new Uint8Array(await file.slice(0, 21).arrayBuffer());
  const matches = (offset: number, text: string) =>
    [...text].every((character, index) => header[offset + index] === character.charCodeAt(0));
  return header.length === 21 && matches(0, "RIFF") && matches(8, "WEBP") &&
    matches(12, "VP8X") && (header[20] & 0x02) !== 0;
}

export async function preparePostImage(file: File): Promise<File> {
  const validationError = validatePostImage(file);
  if (validationError) throw new Error(validationError);
  if (file.type === "image/gif") return file;

  let drawable: DrawableImage | null = null;
  try {
    if (await isAnimatedWebp(file)) return file;
    drawable = await loadDrawable(file);
    if (!drawable.width || !drawable.height || drawable.width * drawable.height > MAX_SOURCE_PIXELS) {
      return file;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return file;

    const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(drawable.width, drawable.height));
    canvas.width = Math.max(1, Math.round(drawable.width * scale));
    canvas.height = Math.max(1, Math.round(drawable.height * scale));
    context.drawImage(drawable.source, 0, 0, canvas.width, canvas.height);

    const compressed = await encodeWebp(canvas, WEBP_QUALITY);
    return compressed.size < file.size
      ? new File([compressed], "post.webp", { type: "image/webp" })
      : file;
  } catch {
    // Compression is optional; keep the existing upload flow if the browser cannot encode this image.
    return file;
  } finally {
    drawable?.release();
  }
}
