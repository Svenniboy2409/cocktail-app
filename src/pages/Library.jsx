import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cocktails } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import PantrySheet from '../components/PantrySheet'
import SettingsSheet from '../components/SettingsSheet'
import FolderSheet from '../components/FolderSheet'
import FolderCover from '../components/FolderCover'
import ReorderableGrid from '../components/ReorderableGrid'
import SectionList from '../components/SectionList'
import {
  useSavedIds,
  useUserRecipes,
  usePantry,
  useFolders,
  useFolderView,
  useSectionOrder,
} from '../lib/hooks'
import { setFolderOrder, setRecipeOrder, setSavedOrder } from '../lib/storage'
import {
  IconBottle,
  IconSettings,
  IconFolderPlus,
  IconChevron,
  IconSort,
} from '../components/icons'
import { useI18n } from '../lib/i18n'

export default function Library({ onCreate }) {
  const navigate = useNavigate()
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()
  const { folders } = useFolders()
  const folderView = useFolderView()
  const sectionOrder = useSectionOrder()
  const pantry = usePantry()
  const { t } = useI18n()
  const [barOpen, setBarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newFolder, setNewFolder] = useState(false)
  const [sorting, setSorting] = useState(false)

  const savedCocktails = useMemo(() => {
    const pool = [...recipes, ...cocktails]
    return savedIds
      .map((id) => pool.find((c) => c.id === id))
      .filter(Boolean)
  }, [savedIds, recipes])

  const count = (n) => t(n === 1 ? '{n} cocktail' : '{n} cocktails', { n })

  const head = (title, n, action) => (
    <div className="section-head">
      <div className="section-title">
        <h2>{title}</h2>
        <span className="count">{n}</span>
      </div>
      {!sorting && action}
    </div>
  )

  const nothing = <p className="section-empty">{t('Nothing here yet')}</p>

  const folderCard = (f) => (
    <div className="card folder-card">
      <div className="card-media">
        <FolderCover folder={f} />
        <div className="card-body">
          <h3>{f.name}</h3>
          <div className="card-tag">{count(f.ids?.length || 0)}</div>
        </div>
      </div>
    </div>
  )

  const folderRow = (f) => (
    <div className="folder-row">
      <FolderCover folder={f} className="sm" />
      <span className="folder-row-text">
        <span className="folder-row-name">{f.name}</span>
        <span className="folder-row-count">{count(f.ids?.length || 0)}</span>
      </span>
      <IconChevron width="18" height="18" />
    </div>
  )

  // Each section knows how to draw itself both ways: as it normally reads, and
  // as something you can pick items out of and drop them somewhere else.
  const sections = {
    folders: {
      key: 'folders',
      header: head(
        t('Folders'),
        folders.length,
        folders.length > 0 && (
          <button className="section-action" onClick={() => setNewFolder(true)}>
            <IconFolderPlus width="18" height="18" /> {t('New folder')}
          </button>
        ),
      ),
      body: sorting ? (
        folders.length === 0 ? (
          nothing
        ) : (
          <ReorderableGrid
            items={folders}
            className={folderView === 'list' ? 'folder-rows' : 'grid folder-grid'}
            renderItem={folderView === 'list' ? folderRow : folderCard}
            onReorder={setFolderOrder}
          />
        )
      ) : folders.length === 0 ? (
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
      ),
    },

    recipes: {
      key: 'recipes',
      header: head(t('My recipes'), recipes.length),
      body: sorting ? (
        recipes.length === 0 ? (
          nothing
        ) : (
          <ReorderableGrid
            items={recipes}
            renderItem={(c) => <CocktailCard cocktail={c} still />}
            onReorder={setRecipeOrder}
          />
        )
      ) : recipes.length === 0 ? (
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
      ),
    },

    saved: {
      key: 'saved',
      header: head(t('Saved'), savedCocktails.length),
      body: sorting ? (
        savedCocktails.length === 0 ? (
          nothing
        ) : (
          <ReorderableGrid
            items={savedCocktails}
            renderItem={(c) => <CocktailCard cocktail={c} still />}
            onReorder={setSavedOrder}
          />
        )
      ) : savedCocktails.length === 0 ? (
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
      ),
    },
  }

  const ordered = sectionOrder.map((k) => sections[k]).filter(Boolean)
  const anything = folders.length + recipes.length + savedCocktails.length > 0

  return (
    <div className="page">
      {/* Two rows rather than a column of text beside a column of buttons, so
          the title and the line under it have the whole width to themselves. */}
      <header className="app-header library-header">
        <div className="header-row">
          <div className="eyebrow">{t('Your collection')}</div>
          <div className="header-actions">
            {!sorting && (
              <button
                className="header-action"
                onClick={() => setBarOpen(true)}
                aria-label={t('Set up your bar')}
              >
                <IconBottle />
                <span>{t('My bar')}{pantry.length ? ` · ${pantry.length}` : ''}</span>
              </button>
            )}
            <button
              className="header-action icon-only"
              onClick={() => setSettingsOpen(true)}
              aria-label={t('Open settings')}
              title={t('Settings')}
            >
              <IconSettings />
            </button>
          </div>
        </div>

        <h1>{t('Library')}</h1>

        <div className="header-row header-row-end">
          <div className="sub">{t('Folders, saved cocktails and your own recipes')}</div>
          {anything && (
            <button
              className={'header-action icon-only' + (sorting ? ' on' : '')}
              onClick={() => setSorting((v) => !v)}
              aria-label={t('Rearrange library')}
              aria-pressed={sorting}
              title={t('Rearrange library')}
            >
              <IconSort />
            </button>
          )}
        </div>
      </header>

      {sorting && (
        <div className="reorder-bar">
          <span>{t('Drag a card to move it within its section')}</span>
          <button className="btn btn-primary btn-sm" onClick={() => setSorting(false)}>
            {t('Done')}
          </button>
        </div>
      )}
      {/* Which section comes first is set in Settings; here they only slide
          into place when it changes. */}
      <SectionList sections={ordered} />

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
