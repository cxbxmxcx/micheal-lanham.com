import { clsx, type ClassValue } from "clsx"

// Joins class names. The site's class lists never conflict, so no Tailwind
// merging is needed (tailwind-merge v3 targets Tailwind 4 in any case).
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
