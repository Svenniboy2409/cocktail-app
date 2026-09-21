// Client-side persistence.
//  - Saved library (set of cocktail ids)  -> localStorage
//  - User-created recipes (incl. images)  -> IndexedDB via idb-keyval
//  - Folders (a name, an optional cover, a list of ids) -> IndexedDB, because
//    a cover the user uploaded is far too big for localStorage
import { get, set } from 'idb-keyval'

const SAVED_KEY = 'mixly.saved.v1'
const RECIPES_KEY = 'mixly.recipes.v1'
const PANTRY_KEY = 'mixly.pantry.v1'
const FOLDERS_KEY = 'mixly.folders.v1'
const FOLDER_VIEW_KEY = 'mixly.folderView.v1'

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
  // also drop it from the saved set and out of every folder
  const ids = getSavedIds()
  if (ids.includes(id)) writeSaved(ids.filter((x) => x !== id))
  await removeFromAllFolders(id)
}

/* -------------------- folders (IndexedDB) -------------------- */
// A folder is a name, an optional cover image and an ordered list of cocktail
// ids. A cocktail can sit in as many folders as you like, and being in one
// says nothing about whether it is also saved to the library.

export async function getFolders() {
  return (await get(FOLDERS_KEY)) || []
}

async function writeFolders(folders) {
  await set(FOLDERS_KEY, folders)
  window.dispatchEvent(new Event('mixly:folders-changed'))
  return folders
}

export async function createFolder({ name, image = '', ids = [] } = {}) {
  const folders = await getFolders()
  const folder = {
    id: 'folder-' + Date.now().toString(36),
    name: (name || '').trim() || 'Untitled',
    image,
    ids: Array.from(new Set(ids)),
    createdAt: Date.now(),
  }
  await writeFolders([folder, ...folders])
  return folder
}

export async function updateFolder(id, patch) {
  const folders = await getFolders()
  await writeFolders(folders.map((f) => (f.id === id ? { ...f, ...patch } : f)))
}

export async function deleteFolder(id) {
  const folders = await getFolders()
  await writeFolders(folders.filter((f) => f.id !== id))
}

// Put a cocktail in a folder, or take it out again. Newest first, so the
// cover collage shows what you added most recently.
export async function toggleInFolder(folderId, cocktailId) {
  const folders = await getFolders()
  let added = false
  const next = folders.map((f) => {
    if (f.id !== folderId) return f
    const has = f.ids.includes(cocktailId)
    added = !has
    return { ...f, ids: has ? f.ids.filter((x) => x !== cocktailId) : [cocktailId, ...f.ids] }
  })
  await writeFolders(next)
  return added
}

// Drop a cocktail from every folder — used when a user recipe is deleted.
async function removeFromAllFolders(cocktailId) {
  const folders = await getFolders()
  if (!folders.some((f) => f.ids.includes(cocktailId))) return
  await writeFolders(folders.map((f) => ({ ...f, ids: f.ids.filter((x) => x !== cocktailId) })))
}

/* -------------------- how folders are shown (localStorage) -------------------- */
// 'grid' shows them as cover tiles like the cocktails themselves; 'list' as
// compact rows. Set in Settings, read by the Library.

export function getFolderView() {
  try {
    const v = localStorage.getItem(FOLDER_VIEW_KEY)
    if (v === 'grid' || v === 'list') return v
  } catch {
    /* private mode, blocked storage */
  }
  return 'grid'
}

export function setFolderView(view) {
  try {
    localStorage.setItem(FOLDER_VIEW_KEY, view)
  } catch {
    /* the choice just won't survive a reload */
  }
  window.dispatchEvent(new Event('mixly:folder-view-changed'))
  return view
}

/* -------------------- export / import -------------------- */

export async function exportAll() {
  const data = {
    app: 'mixly',
    version: 1,
    exportedAt: new Date().toISOString(),
    saved: getSavedIds(),
    recipes: await getUserRecipes(),
    folders: await getFolders(),
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
  // Backups written before folders existed simply have none.
  const incomingFolders = Array.isArray(data.folders) ? data.folders : []

  if (merge) {
    const existing = await getUserRecipes()
    const byId = new Map(existing.map((r) => [r.id, r]))
    for (const r of incomingRecipes) byId.set(r.id, r)
    await writeRecipes([...byId.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
    writeSaved([...new Set([...incomingSaved, ...getSavedIds()])])
    setPantry([...incomingPantry, ...getPantry()])
    // Folders of the same name are the same folder; their contents merge.
    const folders = await getFolders()
    const byName = new Map(folders.map((f) => [f.name.toLowerCase(), f]))
    for (const f of incomingFolders) {
      const mine = byName.get((f.name || '').toLowerCase())
      if (mine) {
        mine.ids = [...new Set([...(f.ids || []), ...mine.ids])]
        mine.image = mine.image || f.image || ''
      } else {
        byName.set((f.name || '').toLowerCase(), { ...f, ids: f.ids || [] })
      }
    }
    await writeFolders([...byName.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
  } else {
    await writeRecipes(incomingRecipes)
    writeSaved(incomingSaved)
    setPantry(incomingPantry)
    await writeFolders(incomingFolders)
  }
  return { recipes: incomingRecipes.length, saved: incomingSaved.length }
}
