// specs/feedback/spec.md — shrinks a picked image before it leaves the device,
// so a phone screenshot does not upload several megabytes. `fitWithin` is pure
// and tested; `shrinkImage` is the browser-only part.

export const UPLOAD_MAX_EDGE = 1600
export const UPLOAD_QUALITY = 0.85
/** Above this the image is re-encoded instead of sent as picked. */
export const UPLOAD_BYTES_TARGET = 700 * 1024

/** Scales a width/height so the longest edge is at most `maxEdge`. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number = UPLOAD_MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * A JPEG no larger than it needs to be: scaled to `UPLOAD_MAX_EDGE` and
 * re-encoded once at a lower quality when the first pass is still over the
 * target. A small enough image is returned untouched.
 */
export async function shrinkImage(
  file: File,
  options: { maxEdge?: number; target?: number; type?: string } = {},
): Promise<Blob> {
  const maxEdge = options.maxEdge ?? UPLOAD_MAX_EDGE
  const target = options.target ?? UPLOAD_BYTES_TARGET
  if (file.size <= target) return file

  const bitmap = await createImageBitmap(file)
  const size = fitWithin(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(bitmap, 0, 0, size.width, size.height)

  const encode = (quality: number) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, options.type ?? 'image/jpeg', quality),
    )

  const first = await encode(UPLOAD_QUALITY)
  if (!first) return file
  if (first.size <= target) return first
  const second = await encode(0.65)
  return second && second.size < first.size ? second : first
}
