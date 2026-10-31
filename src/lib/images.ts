import IMAGES from '@/data/images.json'

// 'high' marks the image most likely to be the page's largest paint, 'eager'
// the rest of the first screen, and 'lazy' everything further down.
export type ImagePriority = 'high' | 'eager' | 'lazy'

export function loadingProps(priority: ImagePriority = 'lazy') {
  return { loading: priority === 'lazy' ? 'lazy' as const : 'eager' as const, fetchPriority: priority === 'high' ? 'high' as const : undefined }
}

// The first item of a list is the likely LCP image; the rest of the first row
// is visible on wide screens.
export const listPriority = (index: number, rowSize = 3): ImagePriority => index === 0 ? 'high' : index < rowSize ? 'eager' : 'lazy'

// Built by scripts/build-images.mjs; any image it has not processed falls back
// to the original file.
const MANIFEST: Record<string, { width: number; height: number; variants: { src: string; width: number }[] }> = IMAGES

/** src, srcSet and intrinsic size for an original under public/. `sizes` is
 * the rendered CSS width, fixed or computed from the aspect ratio and the
 * original width (with srcset, sizes also becomes the image's natural width). */
export function responsiveImage(source: string, sizes: string | ((aspect: number, width: number) => string)) {
  const entry = MANIFEST[source]
  if (!entry) return { src: source }
  const { variants, width, height } = entry
  const fallback = [...variants].reverse().find(variant => variant.width <= 480) ?? variants[0]
  return {
    src: fallback.src,
    srcSet: variants.map(variant => `${variant.src} ${variant.width}w`).join(', '),
    sizes: typeof sizes === 'function' ? sizes(width / height, width) : sizes,
    width, height,
  }
}
