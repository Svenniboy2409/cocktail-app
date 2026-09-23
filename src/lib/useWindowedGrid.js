import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { getScroller } from './scroller'

// How many rows to keep beyond the top and bottom of the view, so a quick flick
// does not outrun the rendering.
const OVERSCAN = 3
// What to render before anything has been measured — enough to fill a screen
// and give the first row something to be measured from.
const SEED = 24

// Render only the part of a long grid that is near the view.
//
// Growing the list as it was scrolled meant that by the time somebody was a few
// hundred cards down, all of those cards were still in the page: every one of
// them laid out, painted and kept in memory, and every scroll a little heavier
// than the last. So the window now moves instead of growing — rows come in at
// the bottom and go out at the top, and what is in the page stays the size of a
// screenful however far down you are.
//
// The rows that are not rendered are still accounted for, as padding above and
// below, so the page is its full height from the start: the scrollbar tells the
// truth, and coming back to a position works because the position still exists.
//
// The grid's shape is measured rather than assumed — how many columns, how tall
// a card, how big the gaps — so this follows the layout across every screen
// width the stylesheet has a rule for.
// What the last measurement found, kept past the page unmounting. Without it
// the first render of a page we have come back to is a short one, and the
// scroll position we are trying to return to does not exist yet to return to.
let remembered = null

function seed(total) {
  const m = remembered && remembered.width === window.innerWidth ? remembered : null
  const end = Math.min(total, SEED)
  if (!m || !total) return { start: 0, end, padTop: 0, padBottom: 0 }
  const rows = Math.ceil(total / m.cols)
  const shown = Math.ceil(end / m.cols)
  return { start: 0, end, padTop: 0, padBottom: Math.max(0, (rows - shown) * m.rowH) }
}

export function useWindowedGrid(total, gridRef) {
  const [range, setRange] = useState(() => seed(total))
  const metrics = useRef(null)

  const measure = useCallback(() => {
    const grid = gridRef.current
    const first = grid?.firstElementChild
    if (!first) return null
    const cs = getComputedStyle(grid)
    const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length || 1
    const gap = parseFloat(cs.rowGap) || 0
    const cardH = first.getBoundingClientRect().height
    if (!cardH) return null
    metrics.current = { cols, rowH: cardH + gap }
    remembered = { ...metrics.current, width: window.innerWidth }
    return metrics.current
  }, [gridRef])

  const update = useCallback(() => {
    const grid = gridRef.current
    const scroller = getScroller()
    if (!grid || !scroller || total === 0) return
    const m =
      measure() ||
      metrics.current ||
      (remembered && remembered.width === window.innerWidth ? remembered : null)
    if (!m) return
    const { cols, rowH } = m
    const rows = Math.ceil(total / cols)
    // Where the grid begins in the scrolled content. Padding sits inside the
    // border box, so this does not move as the window does.
    const gridTop =
      grid.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
    const top = scroller.scrollTop - gridTop
    const firstRow = Math.floor(top / rowH)
    const lastRow = Math.ceil((top + scroller.clientHeight) / rowH)
    const endRow = Math.min(rows, Math.max(1, lastRow + OVERSCAN))
    // Never past the end: a search can shorten the list under a page that is
    // still scrolled deep into the old one, and a window beyond the last row
    // would render nothing at all.
    const startRow = Math.min(Math.max(0, firstRow - OVERSCAN), Math.max(0, endRow - 1))
    const start = startRow * cols
    const end = Math.min(total, endRow * cols)
    // The rows left out on either side, to the pixel: the gap that would have
    // followed each one is part of its height, and the one trailing gap the
    // grid does not draw is the one this leaves off.
    const padTop = startRow * rowH
    const padBottom = Math.max(0, (rows - endRow) * rowH)
    // The space counts as much as the window: a shorter list can want the same
    // rows rendered and a far shorter page, and comparing only the window would
    // leave the page standing at its old height.
    setRange((r) =>
      r.start === start && r.end === end && r.padTop === padTop && r.padBottom === padBottom
        ? r
        : { start, end, padTop, padBottom },
    )
  }, [total, measure, gridRef])

  // Before the first paint, so the page is never briefly the wrong height.
  useLayoutEffect(update, [update])

  useEffect(() => {
    const scroller = getScroller()
    if (!scroller) return undefined
    let queued = false
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        update()
      })
    }
    const onResize = () => {
      metrics.current = null
      update()
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [update])

  return range
}
