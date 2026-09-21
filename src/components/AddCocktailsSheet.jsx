import { useMemo, useState } from 'react'
import { cocktails } from '../data/cocktails'
import { useDismissableSheet, useSavedIds, useUserRecipes } from '../lib/hooks'
import { addToFolder } from '../lib/storage'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

// Filling a folder from the folder itself: everything in your library laid out
// with its picture, tap to select, one button to put the lot in. Nothing
// leaves your saved list — a drink is simply in both places.
export default function AddCocktailsSheet({ folder, onClose }) {
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()
  const { t, tt } = useI18n()
  const showToast = useToast()
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)

  // Your own recipes count as part of the library, and anything already in
  // this folder is left out — there is nothing to add.
  const choices = useMemo(() => {
    const pool = [...recipes, ...cocktails]
    const ids = [...new Set([...recipes.map((r) => r.id), ...savedIds])]
    return ids
      .map((id) => pool.find((c) => c.id === id))
      .filter((c) => c && !folder.ids.includes(c.id))
  }, [savedIds, recipes, folder.ids])

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const handleAdd = async () => {
    if (picked.length === 0) return onClose()
    setBusy(true)
    const n = await addToFolder(folder.id, picked)
    showToast(
      n === 1
        ? t('Added to {folder}', { folder: folder.name })
        : t('Added {n} cocktails to {folder}', { n, folder: folder.name }),
    )
    onClose()
  }

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
      <div
        className="sheet sheet-tall"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Add from your library')}
        style={sheetStyle}
      >
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{t('Add from your library')}</h2>
            <button className="sheet-close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
              {t('Cancel')}
            </button>
          </div>
        </div>

        <div className="sheet-body">
          {choices.length === 0 ? (
            <div className="empty" style={{ padding: '18px 0 8px' }}>
              <div className="icon">🔖</div>
              <h3>{t('Nothing left to add')}</h3>
              <p>{t('Everything you have saved is already in this folder.')}</p>
            </div>
          ) : (
            <div className="pick-grid">
              {choices.map((c) => {
                const on = picked.includes(c.id)
                return (
                  <button
                    key={c.id}
                    className={'pick-card' + (on ? ' on' : '')}
                    onClick={() => toggle(c.id)}
                    aria-pressed={on}
                  >
                    <img src={c.image} alt="" loading="lazy" />
                    <span className="pick-tick">{on ? '✓' : ''}</span>
                    <span className="pick-body">
                      <span className="pick-name">{c.name}</span>
                      <span className="pick-tag">{tt(c.tags?.[0] || c.category)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="sheet-footer">
          <button
            className="btn btn-primary btn-block"
            onClick={handleAdd}
            disabled={busy || choices.length === 0}
          >
            {picked.length === 0
              ? t('Done')
              : t(picked.length === 1 ? 'Add {n} cocktail' : 'Add {n} cocktails', {
                  n: picked.length,
                })}
          </button>
        </div>
      </div>
    </>
  )
}
