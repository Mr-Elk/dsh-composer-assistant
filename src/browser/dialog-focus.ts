import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Initial focus, Escape close, Tab loop, and focus restoration for a modal dialog. */
export function useDialogFocus(active: boolean, dialogRef: RefObject<HTMLElement | null>,
  initialRef: RefObject<HTMLElement | null>, onClose: () => void): void {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => initialRef.current?.focus())
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const nodes = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!nodes.length) { event.preventDefault(); return }
      const first = nodes[0], last = nodes[nodes.length - 1]
      const current = document.activeElement
      if (event.shiftKey) {
        if (current === first || !dialog.contains(current)) { event.preventDefault(); last.focus() }
      } else if (current === last || !dialog.contains(current)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', key, true)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', key, true)
      previous?.focus?.()
    }
  }, [active, dialogRef, initialRef])
}
