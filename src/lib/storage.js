// Client-side persistence.
//  - Saved library (set of cocktail ids)  -> localStorage
//  - User-created recipes (incl. images)  -> IndexedDB via idb-keyval
import { get, set } from 'idb-keyval'

const SAVED_KEY = 'mixly.saved.v1'
const RECIPES_KEY = 'mixly.recipes.v1'
const PANTRY_KEY = 'mixly.pantry.v1'

/* -------------------- your bar / pantry (localStorage) -------------------- */
// The set of base spirits the user has at home, used to power personal
// recommendations on the Discover page.

export function getPantry() {
  try {
    return JSON.parse(localStorage.getItem(PANTRY_KEY)) || []
  } catch {
    return []
  }
}

export function setPantry(spirits) {
  const list = Array.from(new Set(spirits))
  localStorage.setItem(PANTRY_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event('mixly:pantry-changed'))
  return list
}

export function togglePantry(spirit) {
  const current = getPantry()
  const next = current.includes(spirit)
    ? current.filter((s) => s !== spirit)
    : [...current, spirit]
  return setPantry(next)
}

/* -------------------- saved library (localStorage) -------------------- */

export function getSavedIds() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || []
  } catch {
    return []
  }
}

function writeSaved(ids) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event('mixly:saved-changed'))
}

export function isSaved(id) {
  return getSavedIds().includes(id)
}

export function toggleSaved(id) {
  const ids = getSavedIds()
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]
  writeSaved(next)
  return next.includes(id)
}

/* -------------------- user recipes (IndexedDB) -------------------- */

export async function getUserRecipes() {
  return (await get(RECIPES_KEY)) || []
}

async function writeRecipes(recipes) {
  await set(RECIPES_KEY, recipes)
  window.dispatchEvent(new Event('mixly:recipes-changed'))
}

export async function getUserRecipe(id) {
  const recipes = await getUserRecipes()
  return recipes.find((r) => r.id === id) || null
}

export async function addRecipe(recipe) {
  const recipes = await getUserRecipes()
  const record = {
    ...recipe,
    id: recipe.id || 'user-' + Date.now().toString(36),
    isCustom: true,
    createdAt: Date.now(),
  }
  await writeRecipes([record, ...recipes])
  return record
}

export async function updateRecipe(id, patch) {
  const recipes = await getUserRecipes()
  const next = recipes.map((r) => (r.id === id ? { ...r, ...patch } : r))
  await writeRecipes(next)
}

export async function deleteRecipe(id) {
  const recipes = await getUserRecipes()
  await writeRecipes(recipes.filter((r) => r.id !== id))
  // also drop it from the saved set if present
  const ids = getSavedIds()
  if (ids.includes(id)) writeSaved(ids.filter((x) => x !== id))
}

/* -------------------- export / import -------------------- */

export async function exportAll() {
  const data = {
    app: 'mixly',
    version: 1,
    exportedAt: new Date().toISOString(),
    saved: getSavedIds(),
    recipes: await getUserRecipes(),
    pantry: getPantry(),
  }
  return JSON.stringify(data, null, 2)
}

export async function importAll(json, { merge = true } = {}) {
  const data = typeof json === 'string' ? JSON.parse(json) : json
  if (!data || data.app !== 'mixly') {
    throw new Error('This file is not a Mixly backup.')
  }
  const incomingRecipes = Array.isArray(data.recipes) ? data.recipes : []
  const incomingSaved = Array.isArray(data.saved) ? data.saved : []
  const incomingPantry = Array.isArray(data.pantry) ? data.pantry : []

  if (merge) {
    const existing = await getUserRecipes()
    const byId = new Map(existing.map((r) => [r.id, r]))
    for (const r of incomingRecipes) byId.set(r.id, r)
    await writeRecipes([...byId.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
    writeSaved([...new Set([...incomingSaved, ...getSavedIds()])])
    setPantry([...incomingPantry, ...getPantry()])
  } else {
    await writeRecipes(incomingRecipes)
    writeSaved(incomingSaved)
    setPantry(incomingPantry)
  }
  return { recipes: incomingRecipes.length, saved: incomingSaved.length }
}
