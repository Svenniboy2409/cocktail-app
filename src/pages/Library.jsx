import { useMemo, useRef } from 'react'
import { cocktails } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import { useSavedIds, useUserRecipes } from '../lib/hooks'
import { exportAll, importAll } from '../lib/storage'
import { IconDownload, IconUpload } from '../components/icons'
import { useToast } from '../components/Toast'

export default function Library({ onCreate }) {
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()
  const showToast = useToast()
  const fileRef = useRef(null)

  const savedCocktails = useMemo(() => {
    const pool = [...recipes, ...cocktails]
    return savedIds
      .map((id) => pool.find((c) => c.id === id))
      .filter(Boolean)
  }, [savedIds, recipes])

  const handleExport = async () => {
    const json = await exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mixly-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Library exported')
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const res = await importAll(text)
      showToast(`Imported ${res.recipes} recipe(s)`)
    } catch (err) {
      showToast(err.message || 'Import failed')
    }
  }

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <div className="eyebrow">Your collection</div>
          <h1>Library</h1>
          <div className="sub">Saved cocktails and your own recipes</div>
        </div>
      </header>

      {/* ---- your recipes ---- */}
      <div className="section-head">
        <h2>My recipes</h2>
        <span className="count">{recipes.length}</span>
      </div>
      {recipes.length === 0 ? (
        <div className="empty">
          <div className="icon">📝</div>
          <h3>No recipes yet</h3>
          <p>Tap the + button to craft your first cocktail.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onCreate}>
            Create a recipe
          </button>
        </div>
      ) : (
        <div className="grid">
          {recipes.map((c) => (
            <CocktailCard key={c.id} cocktail={c} saved={savedIds.includes(c.id)} />
          ))}
        </div>
      )}

      {/* ---- saved cocktails ---- */}
      <div className="section-head">
        <h2>Saved</h2>
        <span className="count">{savedCocktails.length}</span>
      </div>
      {savedCocktails.length === 0 ? (
        <div className="empty">
          <div className="icon">🔖</div>
          <h3>Nothing saved yet</h3>
          <p>Browse Discover and tap the bookmark to save cocktails here.</p>
        </div>
      ) : (
        <div className="grid">
          {savedCocktails.map((c) => (
            <CocktailCard key={c.id} cocktail={c} saved={true} />
          ))}
        </div>
      )}

      {/* ---- backup ---- */}
      <div className="section-head">
        <h2>Backup</h2>
      </div>
      <p className="muted" style={{ fontSize: 14, margin: '0 2px 14px' }}>
        Your data lives in this browser only. Export a file to back it up or move it to another device.
      </p>
      <div className="detail-actions">
        <button className="btn" style={{ flex: 1 }} onClick={handleExport}>
          <IconDownload /> Export
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
          <IconUpload /> Import
        </button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden-file" onChange={handleImportFile} />
      </div>
    </div>
  )
}
