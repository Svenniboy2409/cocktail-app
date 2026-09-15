import { useMemo } from 'react'
import { SPIRITS } from '../data/cocktails'
import { togglePantry } from '../lib/storage'
import { usePantry, useUserRecipes, useDismissableSheet } from '../lib/hooks'
import { useI18n } from '../lib/i18n'

// Bottom sheet where the user picks which spirits they keep at home.
// Selections persist immediately and drive the Discover recommendations.
export default function PantrySheet({ onClose }) {
  const pantry = usePantry()
  const { recipes } = useUserRecipes()
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)
  const { t, tt } = useI18n()

  // All curated spirits plus any categories introduced by the user's own
  // recipes, so a home-made "Mezcal" drink is selectable too.
  const spirits = useMemo(() => {
    const extra = recipes
      .map((r) => r.category)
      .filter((c) => c && !SPIRITS.includes(c))
    return [...SPIRITS, ...Array.from(new Set(extra)).sort()]
  }, [recipes])

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
      <div className="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label={t('Your bar')} style={sheetStyle}>
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{t('Your bar')}</h2>
            <button className="sheet-close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
              {t('Done')}
            </button>
          </div>
        </div>

        <div className="sheet-body">
          <p className="muted" style={{ margin: '0 0 18px', fontSize: 14 }}>
            {t(
              'Select the spirits you have at home. We’ll use these — together with the cocktails in your library — to recommend drinks you can actually make, right at the top of Discover.',
            )}
          </p>

          <div className="pantry-grid">
            {spirits.map((s) => {
              const on = pantry.includes(s)
              return (
                <button
                  key={s}
                  className={'pantry-chip' + (on ? ' on' : '')}
                  onClick={() => togglePantry(s)}
                  aria-pressed={on}
                >
                  <span className="tick">{on ? '✓' : '+'}</span>
                  {tt(s)}
                </button>
              )
            })}
          </div>

          <div className="pantry-summary">
            {pantry.length === 0
              ? t('Nothing selected yet.')
              : t(pantry.length === 1 ? '{n} spirit in your bar.' : '{n} spirits in your bar.', {
                  n: pantry.length,
                })}
          </div>
        </div>

        <div className="sheet-footer">
          <button className="btn btn-primary btn-block" onClick={onClose}>
            {t('Done')}
          </button>
        </div>
      </div>
    </>
  )
}
