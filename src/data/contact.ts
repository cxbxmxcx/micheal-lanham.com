export const EMAIL = 'cxbxmxcx@micheal-lanham.com'

export function inquiry(subject: string, body: string) {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
