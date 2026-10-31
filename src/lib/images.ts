// 'high' marks the image most likely to be the page's largest paint, 'eager'
// the rest of the first screen, and 'lazy' everything further down.
export type ImagePriority = 'high' | 'eager' | 'lazy'

export function loadingProps(priority: ImagePriority = 'lazy') {
  return { loading: priority === 'lazy' ? 'lazy' as const : 'eager' as const, fetchPriority: priority === 'high' ? 'high' as const : undefined }
}

// The first item of a list is the likely LCP image; the rest of the first row
// is visible on wide screens.
export const listPriority = (index: number, rowSize = 3): ImagePriority => index === 0 ? 'high' : index < rowSize ? 'eager' : 'lazy'
