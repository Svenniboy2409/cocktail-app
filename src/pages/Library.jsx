import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cocktails } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import PantrySheet from '../components/PantrySheet'
import SettingsSheet from '../components/SettingsSheet'
import FolderSheet from '../components/FolderSheet'
import FolderCover from '../components/FolderCover'
import { useSavedIds, useUserRecipes, usePantry, useFolders, useFolderView } from '../lib/hooks'
import { IconBottle, IconSettings, IconFolderPlus, IconChevron } from '../components/icons'
import { useI18n } from '../lib/i18n'

export default function Library({ onCreate }) {
  const navigate = useNavigate()
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()
  const { folders } = useFolders()
  const folderView = useFolderView()
  const pantry = usePantry()
  const { t } = useI18n()
  const [barOpen, setBarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newFolder, setNewFolder] = useState(false)

  const savedCocktails = useMemo(() => {
    const pool = [...recipes, ...cocktails]
    return savedIds
      .map((id) => pool.find((c) => c.id === id))
      .filter(Boolean)
  }, [savedIds, recipes])

  const count = (n) => t(n === 1 ? '{n} cocktail' : '{n} cocktails', { n })

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <div className="eyebrow">{t('Your collection')}</div>
          <h1>{t('Library')}</h1>
          <div className="sub">{t('Folders, saved cocktails and your own recipes')}</div>
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

      {/* ---- folders ---- */}
      <div className="section-head">
        <div className="section-title">
          <h2>{t('Folders')}</h2>
          <span className="count">{folders.length}</span>
        </div>
        {folders.length > 0 && (
          <button className="section-action" onClick={() => setNewFolder(true)}>
            <IconFolderPlus width="18" height="18" /> {t('New folder')}
          </button>
        )}
      </div>
      {folders.length === 0 ? (
        <div className="empty">
          <div className="icon">📁</div>
          <h3>{t('No folders yet')}</h3>
          <p>{t('Group your saved drinks however you like — a party, a season, a shelf of your bar.')}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setNewFolder(true)}>
            <IconFolderPlus /> {t('New folder')}
          </button>
        </div>
      ) : folderView === 'list' ? (
        <div className="folder-rows">
          {folders.map((f) => (
            <Link className="folder-row" key={f.id} to={`/folder/${f.id}`}>
              <FolderCover folder={f} className="sm" />
              <span className="folder-row-text">
                <span className="folder-row-name">{f.name}</span>
                <span className="folder-row-count">{count(f.ids?.length || 0)}</span>
              </span>
              <IconChevron width="18" height="18" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid folder-grid">
          {folders.map((f) => (
            <Link className="card folder-card" key={f.id} to={`/folder/${f.id}`}>
              <div className="card-media">
                <FolderCover folder={f} />
                <div className="card-body">
                  <h3>{f.name}</h3>
                  <div className="card-tag">{count(f.ids?.length || 0)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ---- your recipes ---- */}
      <div className="section-head">
        <div className="section-title">
          <h2>{t('My recipes')}</h2>
          <span className="count">{recipes.length}</span>
        </div>
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
        <div className="section-title">
          <h2>{t('Saved')}</h2>
          <span className="count">{savedCocktails.length}</span>
        </div>
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
      {newFolder && (
        <FolderSheet
          mode="create"
          onClose={() => setNewFolder(false)}
          // A folder you just made is empty, and filling it is the next thing
          // you want, so go straight in.
          onCreated={(f) => {
            setNewFolder(false)
            navigate(`/folder/${f.id}`)
          }}
        />
      )}
    </div>
  )
}
