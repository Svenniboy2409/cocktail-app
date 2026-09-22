import { useEffect, useRef, useState } from 'react'
import { getScroller } from './scroller'

// How many cards to put in the page at a time.
const PAGE = 40

// Grow a long list as it is scrolled rather than rendering all of it.
//
// The catalogue is approaching five hundred drinks, and a card apiece is a lot
// of layout, a lot of paint and a lot of memory for a phone to hold for rows
// nobody has reached yet. This keeps the page short and lets it grow, which
// from the outside looks exactly like an ordinary long list.
//
// Pass a `key` that changes whenever the list itself changes — a search, a
// filter — so the count starts over instead of keeping a stale window.
//
// How far a list had grown is remembered against that key, the way the scroll
// position is: come back to a page from a drink you opened halfway down it and
// the rows have to be there again, or there is nothing to scroll back to.
const grown = new Map()

export function useVisibleCount(total, key) {
  const [count, setCount] = useState(() => grown.get(key) || PAGE)
  const sentinel = useRef(null)
  const first = useRef(true)

  useEffect(() => {
    // Not on the first run, which already started from what was remembered.
    if (first.current) {
      first.current = false
      return
    }
    setCount(grown.get(key) || PAGE)
  }, [key])

  useEffect(() => {
    // Only worth remembering once a list has actually been scrolled into, which
    // keeps this to the handful of views someone really browsed rather than one
    // entry per keystroke in the search box.
    if (count <= PAGE) return
    grown.set(key, count)
    if (grown.size > 24) grown.delete(grown.keys().next().value)
  }, [key, count])

  useEffect(() => {
    const el = sentinel.current
    if (!el || count >= total) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCount((c) => Math.min(total, c + PAGE))
      },
      // Well before it comes into view, so the next rows are already there.
      { root: getScroller(), rootMargin: '700px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [count, total, key])

  return [Math.min(count, total), sentinel]
}
