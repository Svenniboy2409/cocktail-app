import { useEffect, useState, useCallback } from 'react'
import { getSavedIds, getUserRecipes, getPantry } from './storage'

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
