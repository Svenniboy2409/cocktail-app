import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { getScroller } from '../lib/scroller'

// How close to the edge of the screen the finger has to get before the page
// starts scrolling under it, and how fast it goes at the very edge.
const EDGE = 90
const SPEED = 14

// The folder's own grid, rearranged in place.
//
// While a tile is being dragged nothing moves in the array: the tile follows
// the finger and the tiles it displaces slide one place over, all through
// transforms, so every step animates. The order is only rewritten on release,
// by which point the grid already looks exactly like that — nothing jumps.
//
// The geometry is read off the DOM when a drag starts rather than hard-coded,
// so this works at every column count the page uses — and at one column, which
// is how it serves a plain list as well as a grid.
export default function ReorderableGrid({
  items,
  onReorder,
  renderItem,
  className = 'grid',
}) {
  const gridRef = useRef(null)
  const [order, setOrder] = useState(items)
  const [from, setFrom] = useState(null)
  const [delta, setDelta] = useState({ x: 0, y: 0 })
  const metrics = useRef(null)
  const start = useRef(null)
  const pointer = useRef({ x: 0, y: 0 })
  const scrollBy = useRef(0)
  const scroller = useRef(null)

  // Follow the folder when it changes from outside (a drink added, say), but
  // never mid-drag.
  const ids = items.map((c) => c.id).join()
  useEffect(() => {
    if (from == null) setOrder(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids])

  // Where the dragged tile would land if you let go now.
  const to = useMemo(() => {
    if (from == null || !metrics.current) return null
    const { cols, stepX, stepY } = metrics.current
    const col = Math.round((from % cols) + (stepX ? delta.x / stepX : 0))
    const row = Math.round(Math.floor(from / cols) + delta.y / stepY)
    const seat = Math.max(0, row) * cols + Math.max(0, Math.min(cols - 1, col))
    return Math.max(0, Math.min(order.length - 1, seat))
  }, [from, delta, order.length])

  // Where tile i appears to sit right now — one place over if the dragged tile
  // has been pulled across it.
  const seatOf = (i) => {
    if (from == null || to == null) return i
    if (i === from) return to
    if (from < to && i > from && i <= to) return i - 1
    if (to < from && i >= to && i < from) return i + 1
    return i
  }

  const shift = (i) => {
    if (from == null || to == null || !metrics.current) return { x: 0, y: 0 }
    if (i === from) return delta
    const { cols, stepX, stepY } = metrics.current
    const s = seatOf(i)
    return {
      x: ((s % cols) - (i % cols)) * stepX,
      y: (Math.floor(s / cols) - Math.floor(i / cols)) * stepY,
    }
  }

  // Recompute how far the tile has travelled. Called on every pointer move and
  // again on each auto-scroll frame, because the page moving under a still
  // finger counts as travel too.
  const track = useCallback(() => {
    if (!start.current) return
    const top = scroller.current?.scrollTop || 0
    setDelta({
      x: pointer.current.x - start.current.x,
      y: pointer.current.y + top - (start.current.y + start.current.scrollTop),
    })
  }, [])

  // Drag a tile towards the top or bottom of the screen and the page follows.
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
    const tiles = [...gridRef.current.children]
    const rects = tiles.map((el) => el.getBoundingClientRect())
    const cols = rects.filter((r) => Math.abs(r.top - rects[0].top) < 2).length
    metrics.current = {
      cols,
      stepX: cols > 1 ? rects[1].left - rects[0].left : 0,
      stepY: rects.length > cols ? rects[cols].top - rects[0].top : rects[0].height,
    }
    scroller.current = getScroller()
    start.current = { x: e.clientX, y: e.clientY, scrollTop: scroller.current?.scrollTop || 0 }
    pointer.current = { x: e.clientX, y: e.clientY }
    scrollBy.current = 0
    setFrom(i)
    setDelta({ x: 0, y: 0 })
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture not supported */
    }
  }

  const move = (e) => {
    if (from == null) return
    pointer.current = { x: e.clientX, y: e.clientY }
    // Measured against the scrolling element, not the window, since that is
    // what actually moves.
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
      onReorder(next.map((c) => c.id))
    }
    scrollBy.current = 0
    start.current = null
    setFrom(null)
    setDelta({ x: 0, y: 0 })
  }

  return (
    <div className={className + ' reordering'} ref={gridRef}>
      {order.map((item, i) => {
        const d = shift(i)
        return (
          <div
            key={item.id}
            className={'reorder-tile' + (i === from ? ' dragging' : '')}
            style={{
              transform: `translate(${d.x}px, ${d.y}px)`,
              transition: i === from ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)',
            }}
            onPointerDown={(e) => down(e, i)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          >
            {renderItem(item)}
          </div>
        )
      })}
    </div>
  )
}
