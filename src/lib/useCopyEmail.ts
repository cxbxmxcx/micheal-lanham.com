import { useState } from 'react'
import { EMAIL } from '@/data/contact'

// A mailto link does nothing visible on a machine without a mail app, so each
// email call to action also offers to copy the address.
export function useCopyEmail() {
  const [message, setMessage] = useState('')
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setMessage('Email address copied.') }
    catch { setMessage('Copy was unavailable. Select the email address to copy it.') }
  }
  return { copy, message }
}
