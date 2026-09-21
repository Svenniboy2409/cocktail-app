import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { cocktails } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import FolderSheet from '../components/FolderSheet'
import FolderCover from '../components/FolderCover'
import { useFolders, useSavedIds, useUserRecipes } from '../lib/hooks'
import { toggleInFolder } from '../lib/storage'
import { IconBack, IconEdit } from '../components/icons'
import { useToast } from '../components/Toast'
import { useI18n } from '../lib/i18n'

export default function FolderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { t } = useI18n()
  const { folders, loading } = useFolders()
  const { recipes } = useUserRecipes()
  const savedIds = useSavedIds()
  const [editing, setEditing] = useState(false)

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

  const remove = async (cocktailId) => {
    await toggleInFolder(folder.id, cocktailId)
    showToast(t('Removed from {folder}', { folder: folder.name }))
  }

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
          <p>{t('Open a cocktail and tap “Save to folder” to put it in here.')}</p>
          <Link className="btn btn-primary" style={{ marginTop: 16 }} to="/">
            {t('Back to Discover')}
          </Link>
        </div>
      ) : (
        <div className="grid">
          {drinks.map((c) => (
            <CocktailCard
              key={c.id}
              cocktail={c}
              saved={savedIds.includes(c.id)}
              onRemove={() => remove(c.id)}
              removeLabel={t('Remove from {folder}', { folder: folder.name })}
            />
          ))}
        </div>
      )}

      {editing && (
        <FolderSheet
          mode="edit"
          folder={folder}
          onClose={() => setEditing(false)}
          onDeleted={() => navigate('/library', { replace: true })}
        />
      )}
    </div>
  )
}
