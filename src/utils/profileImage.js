const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
export const PROFILE_AVATAR_OUTPUT_SIZE = 512;

export const validateProfileImageFile = (file) => {
  if (!file || !ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Choose an image smaller than 8 MB.");
  }
};

export const createSquareProfileImage = (image, crop) => {
  const { x, y, size } = crop;
  if (
    !image?.naturalWidth ||
    !image?.naturalHeight ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(size) ||
    size <= 0
  ) {
    throw new Error("This image crop is not valid. Please reset the crop and try again.");
  }

  const sourceX = Math.max(0, Math.min(image.naturalWidth - size, x));
  const sourceY = Math.max(0, Math.min(image.naturalHeight - size, y));
  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_AVATAR_OUTPUT_SIZE;
  canvas.height = PROFILE_AVATAR_OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable in this browser.");

  context.drawImage(
    image,
    sourceX,
    sourceY,
    size,
    size,
    0,
    0,
    PROFILE_AVATAR_OUTPUT_SIZE,
    PROFILE_AVATAR_OUTPUT_SIZE,
  );
  return canvas.toDataURL("image/jpeg", 0.9);
};

export const migrateLegacyProfileImage = async (source, position) => {
  if (
    typeof document === "undefined" ||
    typeof source !== "string" ||
    !source.startsWith("data:image/")
  ) {
    return source || "";
  }

  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("The saved profile image could not be opened."));
    image.src = source;
  });

  const size = Math.min(image.naturalWidth, image.naturalHeight);
  if (!size || image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
    throw new Error("The saved profile image has unsupported dimensions.");
  }

  if (image.naturalWidth === image.naturalHeight && size <= PROFILE_AVATAR_OUTPUT_SIZE) {
    return source;
  }

  const horizontal = Math.max(0, Math.min(100, Number(position?.x) || 50)) / 100;
  const vertical = Math.max(0, Math.min(100, Number(position?.y) || 50)) / 100;
  return createSquareProfileImage(image, {
    x: (image.naturalWidth - size) * horizontal,
    y: (image.naturalHeight - size) * vertical,
    size,
  });
};