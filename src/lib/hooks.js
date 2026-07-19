import { useEffect, useState, useCallback, useRef } from 'react'
import { getSavedIds, getUserRecipes, getPantry } from './storage'

// Behaviour shared by the bottom sheets (New recipe, Your bar):
//  1. lock the page behind the sheet so only the sheet is interactive;
//  2. let the user swipe the top bar down to dismiss.
// Returns props to spread on the sheet element and its drag handle.
export function useDismissableSheet(onDismiss) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef(null)
  const sheetRef = useRef(null)

  // Scroll-lock the body while the sheet is mounted (iOS-safe).
  useEffect(() => {
    const scrollY = window.scrollY
    const { body } = document
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      Object.assign(body.style, prev)
      window.scrollTo(0, scrollY)
    }
  }, [])

  const end = () => {
    if (start.current == null) return
    start.current = null
    setDragging(false)
    if (dragY > 110) {
      setDragY(window.innerHeight) // slide the rest of the way out
      setTimeout(onDismiss, 240) // let the slide-out + backdrop fade finish
    } else {
      setDragY(0)
    }
  }

  const handleProps = {
    onPointerDown: (e) => {
      start.current = e.clientY
      setDragging(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* capture not supported */
      }
    },
    onPointerMove: (e) => {
      if (start.current == null) return
      const dy = e.clientY - start.current
      setDragY(dy > 0 ? dy : 0)
    },
    onPointerUp: end,
    onPointerCancel: end,
  }

  // How far the sheet has travelled towards being closed, 0 → 1. Used to fade
  // the backdrop in step with the drag so the page brightens gradually.
  const sheetH = sheetRef.current?.offsetHeight || (typeof window !== 'undefined' ? window.innerHeight : 800)
  const progress = Math.min(1, Math.max(0, dragY) / sheetH)

  const sheetStyle = {
    transform: `translate(-50%, ${dragY}px)`,
    transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)',
  }
  const backdropStyle = {
    opacity: 1 - progress,
    transition: dragging ? 'none' : 'opacity 0.28s ease',
  }

  return { sheetRef, handleProps, sheetStyle, backdropStyle }
}

// Reactive list of saved cocktail ids, kept in sync via a custom event.
export function useSavedIds() {
  const [ids, setIds] = useState(getSavedIds)
  useEffect(() => {
    const sync = () => setIds(getSavedIds())
    window.addEventListener('mixly:saved-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('mixly:saved-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return ids
}

// Reactive list of spirits the user has at home ("your bar").
export function usePantry() {
  const [pantry, setPantry] = useState(getPantry)
  useEffect(() => {
    const sync = () => setPantry(getPantry())
    window.addEventListener('mixly:pantry-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('mixly:pantry-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return pantry
}

// Reactive list of user recipes from IndexedDB.
export function useUserRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => {
    getUserRecipes().then((r) => {
      setRecipes(r)
      setLoading(false)
    })
  }, [])
  useEffect(() => {
    refresh()
    window.addEventListener('mixly:recipes-changed', refresh)
    return () => window.removeEventListener('mixly:recipes-changed', refresh)
  }, [refresh])
  return { recipes, loading, refresh }
}
