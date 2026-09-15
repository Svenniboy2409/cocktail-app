import { useMemo, useState } from 'react'
import { cocktails } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import PantrySheet from '../components/PantrySheet'
import SettingsSheet from '../components/SettingsSheet'
import { useSavedIds, useUserRecipes, usePantry } from '../lib/hooks'
import { IconBottle, IconSettings } from '../components/icons'
import { useI18n } from '../lib/i18n'

export default function Library({ onCreate }) {
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()
  const pantry = usePantry()
  const { t } = useI18n()
  const [barOpen, setBarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const savedCocktails = useMemo(() => {
    const pool = [...recipes, ...cocktails]
    return savedIds
      .map((id) => pool.find((c) => c.id === id))
      .filter(Boolean)
  }, [savedIds, recipes])

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <div className="eyebrow">{t('Your collection')}</div>
          <h1>{t('Library')}</h1>
          <div className="sub">{t('Saved cocktails and your own recipes')}</div>
        </div>
        <div className="header-actions">
          <button
            className="header-action"
            onClick={() => setBarOpen(true)}
            aria-label={t('Set up your bar')}
          >
            <IconBottle />
            <span>{t('My bar')}{pantry.length ? ` · ${pantry.length}` : ''}</span>
          </button>
          <button
            className="header-action icon-only"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('Open settings')}
            title={t('Settings')}
          >
            <IconSettings />
          </button>
        </div>
      </header>

      {/* ---- your recipes ---- */}
      <div className="section-head">
        <h2>{t('My recipes')}</h2>
        <span className="count">{recipes.length}</span>
      </div>
      {recipes.length === 0 ? (
        <div className="empty">
          <div className="icon">📝</div>
          <h3>{t('No recipes yet')}</h3>
          <p>{t('Tap the + button to craft your first cocktail.')}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onCreate}>
            {t('Create a recipe')}
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
        <h2>{t('Saved')}</h2>
        <span className="count">{savedCocktails.length}</span>
      </div>
      {savedCocktails.length === 0 ? (
        <div className="empty">
          <div className="icon">🔖</div>
          <h3>{t('Nothing saved yet')}</h3>
          <p>{t('Browse Discover and tap the bookmark to save cocktails here.')}</p>
        </div>
      ) : (
        <div className="grid">
          {savedCocktails.map((c) => (
            <CocktailCard key={c.id} cocktail={c} saved={true} />
          ))}
        </div>
      )}

      {barOpen && <PantrySheet onClose={() => setBarOpen(false)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
