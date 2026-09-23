import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { getScroller } from '../lib/scroller'

// How close to the edge of the screen the finger has to get before the page
// starts scrolling under it, and how fast it goes at the very edge.
const EDGE = 90
const SPEED = 14

// A stack of sections, rearranged by dragging one of them by its heading.
//
// The sections are wildly different heights — a handful of folders against
// four hundred saved drinks — and that breaks the way the grid previews a
// move. Sliding a short section out of a long one's way means moving it by the
// long one's height, which is thousands of pixels: correct, and useless to
// look at, because the section simply leaves the screen.
//
// So taking hold of a heading folds every section down to its heading for as
// long as you are dragging. What is left is a short list of equal rows that
// reorders the way anything else does — the row follows your finger, the ones
// it passes slide over, and you can see the whole thing at once. Let go and
// the sections open again, in their new order.
export default function ReorderableSections({ sections, onReorder }) {
  const wrapRef = useRef(null)
  const [order, setOrder] = useState(sections)
  const [from, setFrom] = useState(null)
  const [dy, setDy] = useState(0)
  const [settling, setSettling] = useState(false)
  const boxes = useRef([])
  const start = useRef(null)
  const pointer = useRef(0)
  const scrollBy = useRef(0)
  const scroller = useRef(null)

  const keys = sections.map((s) => s.key).join()
  useEffect(() => {
    if (from == null) setOrder(sections)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys])

  // Where the section would land if you let go now. Walk outwards from where it
  // started, taking each neighbour it has travelled more than halfway across.
  const to = useMemo(() => {
    if (from == null || !boxes.current.length) return null
    const b = boxes.current
    let target = from
    if (dy > 0) {
      let past = 0
      for (let i = from + 1; i < b.length; i++) {
        past += b[i]
        if (dy > past - b[i] / 2) target = i
        else break
      }
    } else if (dy < 0) {
      let past = 0
      for (let i = from - 1; i >= 0; i--) {
        past += b[i]
        if (-dy > past - b[i] / 2) target = i
        else break
      }
    }
    return target
  }, [from, dy])

  // Folded down, every row is the same height, so a displaced one moves by
  // exactly the height of the row being dragged.
  const offset = (i) => {
    if (from == null || to == null) return 0
    if (i === from) return dy
    const moved = boxes.current[from] || 0
    if (from < to && i > from && i <= to) return -moved
    if (to < from && i >= to && i < from) return moved
    return 0
  }

  const track = useCallback(() => {
    if (!start.current) return
    const top = scroller.current?.scrollTop || 0
    setDy(pointer.current + top - (start.current.y + start.current.scrollTop))
  }, [])

  useEffect(() => {
    if (from == null) return undefined
    let raf
    const step = () => {
      if (scrollBy.current && scroller.current) {
        scroller.current.scrollTop += scrollBy.current
        track()
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [from, track])

  const down = (e, i) => {
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    const wrap = wrapRef.current
    const blocks = [...wrap.children]
    const before = blocks[i].getBoundingClientRect().top

    // Fold first, then measure, so the numbers describe what is on screen.
    // Done on the element rather than through state because the measurements
    // below need it to have happened already.
    wrap.classList.add('is-folded')

    scroller.current = getScroller()
    // Folding pulls everything upwards; scroll by as much as the heading you
    // are holding moved, so it stays under your finger.
    const shifted = blocks[i].getBoundingClientRect().top - before
    if (scroller.current && shifted) scroller.current.scrollTop += shifted

    const rects = blocks.map((el) => el.getBoundingClientRect())
    boxes.current = rects.map((r, idx) =>
      idx + 1 < rects.length ? rects[idx + 1].top - r.top : r.height,
    )
    start.current = { y: e.clientY, scrollTop: scroller.current?.scrollTop || 0 }
    pointer.current = e.clientY
    scrollBy.current = 0
    setFrom(i)
    setDy(0)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture not supported */
    }
  }

  const move = (e) => {
    if (from == null) return
    pointer.current = e.clientY
    const box = scroller.current?.getBoundingClientRect()
    const over = box ? e.clientY - (box.top + EDGE) : 0
    const under = box ? e.clientY - (box.bottom - EDGE) : 0
    scrollBy.current = over < 0 ? Math.max(-SPEED, over / 6) : under > 0 ? Math.min(SPEED, under / 6) : 0
    track()
  }

  const up = () => {
    if (from == null) return
    if (to != null && to !== from) {
      const next = [...order]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      // The same swap the grid makes: new places and no transforms, which
      // cancel out — but only if the transforms are not left animating their
      // way to nothing afterwards. Transitions off for the frame that commits.
      setSettling(true)
      setOrder(next)
      onReorder(next.map((s) => s.key))
    }
    wrapRef.current?.classList.remove('is-folded')
    scrollBy.current = 0
    start.current = null
    setFrom(null)
    setDy(0)
  }

  useEffect(() => {
    if (!settling) return undefined
    let inner
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSettling(false))
    })
    return () => {
      cancelAnimationFrame(outer)
      if (inner) cancelAnimationFrame(inner)
    }
  }, [settling])

  return (
    <div className={'section-stack' + (from != null ? ' is-folded' : '')} ref={wrapRef}>
      {order.map((section, i) => (
        <div
          key={section.key}
          className={'section-block' + (i === from ? ' dragging' : '')}
          style={{
            transform: `translateY(${offset(i)}px)`,
            transition:
              i === from || settling
                ? 'none'
                : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
        >
          {/* Only the heading picks the section up, so dragging a card inside
              it rearranges the cards rather than the whole block. */}
          <div
            className="section-grip"
            onPointerDown={(e) => down(e, i)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          >
            {section.header}
          </div>
          <div className="section-body">{section.body}</div>
        </div>
      ))}
    </div>
  )
}
