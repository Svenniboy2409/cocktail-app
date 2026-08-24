import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Pages that should pick up where you left off. Everything else — a cocktail's
// detail page above all — always opens at the top.
const REMEMBERED = ['/', '/library']

// Kept outside the component so positions survive the pages unmounting.
const positions = new Map()

// A single-page app keeps one scrolling window, so without this you land on a
// new page at whatever height the previous one was scrolled to.
export default function ScrollManager() {
  const { pathname } = useLocation()
  const prevPath = useRef(null)
  // Tracked continuously rather than read on navigation: by the time we switch
  // routes the browser may already have clamped window.scrollY to the new,
  // possibly shorter page.
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      lastY.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    // Remember how far down the page we are leaving was scrolled.
    if (prevPath.current && prevPath.current !== pathname) {
      positions.set(prevPath.current, lastY.current)
    }
    prevPath.current = pathname

    const target = REMEMBERED.includes(pathname) ? positions.get(pathname) ?? 0 : 0
    window.scrollTo(0, target)
    lastY.current = target
  }, [pathname])

  return null
}
