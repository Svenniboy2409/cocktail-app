import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { cocktailById, glassesOf } from '../data/cocktails'
import { placesOf, cityOf, originLabel } from '../data/origins'
import { useUserRecipes, useSavedIds, useFolders } from '../lib/hooks'
import { toggleSaved, deleteRecipe } from '../lib/storage'
import { IconBack, IconBookmark, IconGlass, IconGarnish, IconPlace, IconTrash, IconEdit, IconFolder } from '../components/icons'
import { searchFor } from '../lib/discoverFilters'
import { forgetScrollPosition } from '../components/ScrollManager'
import { useToast } from '../components/Toast'
import { useI18n } from '../lib/i18n'
import FolderSheet from '../components/FolderSheet'

export default function CocktailDetail({ onEdit }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { t, tt, tr } = useI18n()
  const savedIds = useSavedIds()
  const { recipes, loading } = useUserRecipes()
  const [folderOpen, setFolderOpen] = useState(false)
  const { folders } = useFolders()

  const cocktail = useMemo(
    () => cocktailById(id) || recipes.find((r) => r.id === id),
    [id, recipes],
  )

  if (!cocktail) {
    // user recipes load async; wait before declaring "not found"
    if (loading && id?.startsWith('user-')) {
      return <div className="page" />
    }
    return (
      <div className="page">
        <div className="empty">
          <div className="icon">🤔</div>
          <h3>{t('Cocktail not found')}</h3>
          <Link className="btn btn-primary" to="/">{t('Back to Discover')}</Link>
        </div>
      </div>
    )
  }

  const saved = savedIds.includes(cocktail.id)
  const origin = originLabel(cocktail)
  const inFolders = folders.filter((f) => f.ids?.includes(cocktail.id)).length

  // Every pill in the meta row runs a search on Discover, so you can pull the
  // thread from any drink: its country, its glass, or what's on top of it.
  const runSearch = (term) => {
    searchFor(term)
    forgetScrollPosition('/')
    navigate('/')
  }

  // The most specific place we know — the city if there is one.
  const place = cityOf(cocktail) || placesOf(cocktail)[0]
  // Recipes name their glass freely ("Rocks (chilled)"), so search the family
  // it belongs to rather than the label, which would find nothing.
  const glassTerm = glassesOf(cocktail)[0] || cocktail.glass
  // Garnishes often list two things; search the first, which is the main one.
  const garnishTerm = (cocktail.garnish || '')
    .replace(/\([^)]*\)/g, '')
    .split(',')[0]
    .trim()

  const handleSave = () => {
    const now = toggleSaved(cocktail.id)
    showToast(t(now ? 'Saved to library' : 'Removed from library'))
  }

  const handleDelete = async () => {
    if (!window.confirm(t('Delete “{name}”? This can’t be undone.', { name: cocktail.name }))) return
    await deleteRecipe(cocktail.id)
    showToast(t('Recipe deleted'))
    navigate('/library')
  }

  return (
    <div className="detail">
      <div className="detail-hero">
        <button className="detail-back" onClick={() => navigate(-1)} aria-label={t('Go back')}>
          <IconBack />
        </button>
        <img src={cocktail.image} alt={cocktail.name} />
        <div className="detail-hero-text">
          <div className="eyebrow">{tt(cocktail.category || 'Cocktail')}</div>
          <h1>{cocktail.name}</h1>
          <div className="detail-meta-row">
            {cocktail.tags?.map((tag) => (
              <span className="pill" key={tag}>{tt(tag)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-body">
        {cocktail.scenario && (
          <div className="scenario">
            <span className="q">“</span>
            <p>{tr(cocktail.scenario)}</p>
          </div>
        )}

        {(cocktail.glass || cocktail.garnish || origin) && (
          <div className="detail-meta-row" style={{ marginBottom: 26 }}>
            {cocktail.glass && (
              <button
                className="pill pill-link"
                onClick={() => runSearch(glassTerm)}
                title={t('Show drinks served in a {glass} glass', { glass: tt(glassTerm).toLowerCase() })}
              >
                <IconGlass style={{ verticalAlign: '-4px', marginRight: 6 }} />{tr(cocktail.glass)}
              </button>
            )}
            {garnishTerm && garnishTerm !== 'None' && (
              <button
                className="pill pill-link"
                onClick={() => runSearch(garnishTerm)}
                title={t('Show drinks garnished with {garnish}', { garnish: garnishTerm.toLowerCase() })}
              >
                <IconGarnish style={{ verticalAlign: '-4px', marginRight: 6 }} />{tr(cocktail.garnish)}
              </button>
            )}
            {/* Tapping the origin searches Discover for that place, which is
                how you find out the search box knows about countries at all. */}
            {origin && (
              <button
                className="pill pill-link"
                onClick={() => runSearch(place)}
                title={t('Show drinks from {place}', { place })}
              >
                <IconPlace style={{ verticalAlign: '-4px', marginRight: 6 }} />{origin}
              </button>
            )}
          </div>
        )}

        {cocktail.ingredients?.length > 0 && (
          <div className="detail-section">
            <h2>{t('Ingredients')}</h2>
            <ul className="ingredients">
              {cocktail.ingredients.map((ing, i) => (
                <li key={i}>
                  <span className="ing-name">{tr(ing.name)}</span>
                  {ing.amount && <span className="ing-amt">{tr(ing.amount)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cocktail.instructions?.length > 0 && (
          <div className="detail-section">
            <h2>{t('Recipe')}</h2>
            <ol className="steps">
              {cocktail.instructions.map((step, i) => (
                <li key={i}><p>{tr(step)}</p></li>
              ))}
            </ol>
          </div>
        )}

        <div className="detail-actions">
          <button
            className={'btn ' + (saved ? 'btn-ghost' : 'btn-primary')}
            style={{ flex: 1 }}
            onClick={handleSave}
          >
            <IconBookmark filled={saved} />
            {t(saved ? 'Saved to library' : 'Save to library')}
          </button>
          {/* Folders are separate from the library: a drink can sit in a
              folder whether or not the bookmark is on. */}
          <button
            className={'btn' + (inFolders ? ' btn-on' : '')}
            style={{ flex: 1 }}
            onClick={() => setFolderOpen(true)}
          >
            <IconFolder />
            {inFolders
              ? t(inFolders === 1 ? 'In {n} folder' : 'In {n} folders', { n: inFolders })
              : t('Save to folder')}
          </button>
        </div>

        {cocktail.isCustom && (
          <div className="detail-actions">
            <button className="btn" style={{ flex: 1 }} onClick={() => onEdit?.(cocktail)}>
              <IconEdit /> {t('Edit')}
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
              <IconTrash /> {t('Delete')}
            </button>
          </div>
        )}
      </div>

      {folderOpen && (
        <FolderSheet mode="pick" cocktailId={cocktail.id} onClose={() => setFolderOpen(false)} />
      )}
    </div>
  )
}
