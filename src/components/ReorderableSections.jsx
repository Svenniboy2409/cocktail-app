import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { getScroller } from '../lib/scroller'

// How close to the edge of the screen the finger has to get before the page
// starts scrolling under it, and how fast it goes at the very edge.
const EDGE = 90
const SPEED = 14

// A stack of blocks, rearranged by dragging one of them by its heading.
//
// Same idea as the grid: nothing moves in the array while you drag, the block
// follows your finger and the ones it passes slide out of the way, and the
// order is only rewritten when you let go — so every step animates and nothing
// jumps. Unlike the grid the blocks are all different heights, so the distance
// each one travels is measured rather than counted in rows.
export default function ReorderableSections({ sections, onReorder }) {
  const wrapRef = useRef(null)
  const [order, setOrder] = useState(sections)
  const [from, setFrom] = useState(null)
  const [dy, setDy] = useState(0)
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

  // Where the block would land if you let go now. Walk outwards from where it
  // started, taking each neighbour it has travelled more than halfway across.
  const to = useMemo(() => {
    if (from == null || !boxes.current.length) return null
    const b = boxes.current
    let target = from
    if (dy > 0) {
      let past = 0
      for (let i = from + 1; i < b.length; i++) {
        past += b[i].outer
        if (dy > past - b[i].outer / 2) target = i
        else break
      }
    } else if (dy < 0) {
      let past = 0
      for (let i = from - 1; i >= 0; i--) {
        past += b[i].outer
        if (-dy > past - b[i].outer / 2) target = i
        else break
      }
    }
    return target
  }, [from, dy])

  // Every block between the two positions moves over by exactly the height of
  // the one being dragged — that is the gap it leaves and the room it needs.
  const offset = (i) => {
    if (from == null || to == null) return 0
    if (i === from) return dy
    const moved = boxes.current[from]?.outer || 0
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
    const blocks = [...wrapRef.current.children]
    const rects = blocks.map((el) => el.getBoundingClientRect())
    // The distance from one block's top to the next, which is its height plus
    // whatever the stylesheet puts between them.
    boxes.current = rects.map((r, idx) => ({
      outer: idx + 1 < rects.length ? rects[idx + 1].top - r.top : r.height,
    }))
    scroller.current = getScroller()
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
      setOrder(next)
      onReorder(next.map((s) => s.key))
    }
    scrollBy.current = 0
    start.current = null
    setFrom(null)
    setDy(0)
  }

  return (
    <div className="section-stack" ref={wrapRef}>
      {order.map((section, i) => (
        <div
          key={section.key}
          className={'section-block' + (i === from ? ' dragging' : '')}
          style={{
            transform: `translateY(${offset(i)}px)`,
            transition: i === from ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)',
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
          {section.body}
        </div>
      ))}
    </div>
  )
}
