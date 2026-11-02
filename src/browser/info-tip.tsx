import { useLayoutEffect, useRef, useState } from 'react'

/** Small circled-i trigger with hover, keyboard and click support. */
export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number; width: number } | null>(null)
  const hovered = useRef(false)
  const wrap = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    if (!open) { setPosition(null); return }
    const rect = wrap.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(300, window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.right + 8), window.innerWidth - width - 8)
    const top = Math.min(Math.max(40, rect.top + rect.height / 2), window.innerHeight - 40)
    setPosition({ left, top, width })
  }, [open])
  return <span ref={wrap} className="dsh-ia-info-wrap">
    <button type="button" className="dsh-ia-info" aria-label={label} aria-expanded={open}
      onMouseEnter={() => { hovered.current = true; setOpen(true) }}
      onMouseLeave={() => { hovered.current = false; setOpen(false) }}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setOpen(true) }}
      onBlur={() => setOpen(false)}
      onClick={() => { if (!hovered.current) setOpen(value => !value) }}>i</button>
    {open && <span role="tooltip" className="dsh-ia-tip" style={position ?? { visibility: 'hidden' }}>{text}</span>}
  </span>
}
