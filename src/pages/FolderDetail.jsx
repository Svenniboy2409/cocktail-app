import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { cocktails } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import FolderSheet from '../components/FolderSheet'
import FolderCover from '../components/FolderCover'
import AddCocktailsSheet from '../components/AddCocktailsSheet'
import FolderReorderSheet from '../components/FolderReorderSheet'
import { useFolders, useSavedIds, useUserRecipes } from '../lib/hooks'
import { IconBack, IconEdit, IconSort, IconFolderPlus } from '../components/icons'
import { useI18n } from '../lib/i18n'

export default function FolderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { folders, loading } = useFolders()
  const { recipes } = useUserRecipes()
  const savedIds = useSavedIds()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [sorting, setSorting] = useState(false)

  const folder = folders.find((f) => f.id === id)

  const drinks = useMemo(() => {
    if (!folder) return []
    const pool = [...recipes, ...cocktails]
    return folder.ids.map((x) => pool.find((c) => c.id === x)).filter(Boolean)
  }, [folder, recipes])

  if (loading) return <div className="page" />

  if (!folder) {
    return (
      <div className="page">
        <div className="empty">
          <div className="icon">📁</div>
          <h3>{t('Folder not found')}</h3>
          <Link className="btn btn-primary" to="/library">{t('Back to Library')}</Link>
        </div>
      </div>
    )
  }

  // The same pair of ways to put something in, shown under an empty folder and
  // again under a full one.
  const addActions = (
    <div className="folder-add">
      <button className="btn btn-primary" onClick={() => setAdding(true)}>
        <IconFolderPlus /> {t('Add cocktails to folder')}
      </button>
      <Link className="text-link" to="/">{t('Browse in Discover')}</Link>
    </div>
  )

  return (
    <div className="page">
      <header className="app-header folder-header">
        <button className="header-action icon-only" onClick={() => navigate(-1)} aria-label={t('Go back')}>
          <IconBack />
        </button>
        <div className="folder-header-text">
          <FolderCover folder={folder} className="sm" />
          <div>
            <h1>{folder.name}</h1>
            <div className="sub">
              {t(drinks.length === 1 ? '{n} cocktail' : '{n} cocktails', { n: drinks.length })}
            </div>
          </div>
        </div>
        {drinks.length > 1 && (
          <button
            className="header-action icon-only"
            onClick={() => setSorting(true)}
            aria-label={t('Rearrange')}
            title={t('Rearrange')}
          >
            <IconSort />
          </button>
        )}
        <button
          className="header-action icon-only"
          onClick={() => setEditing(true)}
          aria-label={t('Edit folder')}
          title={t('Edit folder')}
        >
          <IconEdit />
        </button>
      </header>

      {drinks.length === 0 ? (
        <div className="empty">
          <div className="icon">🍸</div>
          <h3>{t('This folder is empty')}</h3>
          {addActions}
        </div>
      ) : (
        <>
          <div className="grid">
            {drinks.map((c) => (
              <CocktailCard
                key={c.id}
                cocktail={c}
                saved={savedIds.includes(c.id)}
                // Tells the cocktail's page which folder you came out of, so it
                // can offer to take it back out again.
                linkTo={`/cocktail/${c.id}?folder=${folder.id}`}
              />
            ))}
          </div>
          <div className="folder-more">
            <p>{t('Add more cocktails to this folder')}</p>
            {addActions}
          </div>
        </>
      )}

      {editing && (
        <FolderSheet
          mode="edit"
          folder={folder}
          onClose={() => setEditing(false)}
          onDeleted={() => navigate('/library', { replace: true })}
        />
      )}
      {adding && <AddCocktailsSheet folder={folder} onClose={() => setAdding(false)} />}
      {sorting && <FolderReorderSheet folder={folder} onClose={() => setSorting(false)} />}
    </div>
  )
}
