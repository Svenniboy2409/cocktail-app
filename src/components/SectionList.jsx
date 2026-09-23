import { useRef, useLayoutEffect } from 'react'

// How long the sections take to slide past each other when their running order
// changes. Slower than a drag, because it happens on its own and wants to be
// followed rather than kept up with.
const SLIDE = 420

// The library's sections, in whatever order they have been given.
//
// Changing that order in Settings would otherwise swap them over between one
// frame and the next, with no way to see what moved where. So the positions
// are noted before the change and the sections are put back where they were,
// then let go of: they slide from the old arrangement into the new one.
export default function SectionList({ sections }) {
  const wrapRef = useRef(null)
  const previous = useRef({ keys: '', tops: new Map() })

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const blocks = [...wrap.children]
    const keys = sections.map((s) => s.key).join()
    const tops = new Map(blocks.map((el) => [el.dataset.key, el.getBoundingClientRect().top]))
    const before = previous.current

    // Only when the running order itself changed — a section growing taller
    // because a folder was added is not something to animate.
    if (before.keys && before.keys !== keys) {
      for (const el of blocks) {
        const was = before.tops.get(el.dataset.key)
        const now = tops.get(el.dataset.key)
        if (was == null || was === now) continue
        // Put it back where it was, then release it on the next frame.
        el.style.transition = 'none'
        el.style.transform = `translateY(${was - now}px)`
        requestAnimationFrame(() => {
          el.style.transition = `transform ${SLIDE}ms cubic-bezier(0.2, 0.9, 0.3, 1)`
          el.style.transform = ''
        })
      }
    }

    previous.current = { keys, tops }
  })

  return (
    <div ref={wrapRef}>
      {sections.map((s) => (
        <div className="section-block" key={s.key} data-key={s.key}>
          {s.header}
          {s.body}
        </div>
      ))}
    </div>
  )
}
