import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { cocktailById } from '../data/cocktails'
import { placesOf, cityOf, originLabel } from '../data/origins'
import { useUserRecipes, useSavedIds } from '../lib/hooks'
import { toggleSaved, deleteRecipe } from '../lib/storage'
import { IconBack, IconBookmark, IconGlass, IconGarnish, IconPlace, IconTrash, IconEdit } from '../components/icons'
import { searchFor } from '../lib/discoverFilters'
import { forgetScrollPosition } from '../components/ScrollManager'
import { useToast } from '../components/Toast'

export default function CocktailDetail({ onEdit }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const savedIds = useSavedIds()
  const { recipes, loading } = useUserRecipes()

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
          <h3>Cocktail not found</h3>
          <Link className="btn btn-primary" to="/">Back to Discover</Link>
        </div>
      </div>
    )
  }

  const saved = savedIds.includes(cocktail.id)
  const origin = originLabel(cocktail)

  // Search for the most specific place we know — the city if there is one.
  const place = cityOf(cocktail) || placesOf(cocktail)[0]
  const showPlace = () => {
    searchFor(place)
    forgetScrollPosition('/')
    navigate('/')
  }

  const handleSave = () => {
    const now = toggleSaved(cocktail.id)
    showToast(now ? 'Saved to your library' : 'Removed from library')
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${cocktail.name}"? This can’t be undone.`)) return
    await deleteRecipe(cocktail.id)
    showToast('Recipe deleted')
    navigate('/library')
  }

  return (
    <div className="detail">
      <div className="detail-hero">
        <button className="detail-back" onClick={() => navigate(-1)} aria-label="Go back">
          <IconBack />
        </button>
        <img src={cocktail.image} alt={cocktail.name} />
        <div className="detail-hero-text">
          <div className="eyebrow">{cocktail.category || 'Cocktail'}</div>
          <h1>{cocktail.name}</h1>
          <div className="detail-meta-row">
            {cocktail.tags?.map((t) => (
              <span className="pill" key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-body">
        {cocktail.scenario && (
          <div className="scenario">
            <span className="q">“</span>
            <p>{cocktail.scenario}</p>
          </div>
        )}

        {(cocktail.glass || cocktail.garnish || origin) && (
          <div className="detail-meta-row" style={{ marginBottom: 26 }}>
            {cocktail.glass && (
              <span className="pill"><IconGlass style={{ verticalAlign: '-4px', marginRight: 6 }} />{cocktail.glass}</span>
            )}
            {cocktail.garnish && cocktail.garnish !== 'None' && (
              <span className="pill"><IconGarnish style={{ verticalAlign: '-4px', marginRight: 6 }} />{cocktail.garnish}</span>
            )}
            {/* Tapping the origin searches Discover for that place, which is
                how you find out the search box knows about countries at all. */}
            {origin && (
              <button
                className="pill pill-link"
                onClick={showPlace}
                title={`Show drinks from ${place}`}
              >
                <IconPlace style={{ verticalAlign: '-4px', marginRight: 6 }} />{origin}
              </button>
            )}
          </div>
        )}

        {cocktail.ingredients?.length > 0 && (
          <div className="detail-section">
            <h2>Ingredients</h2>
            <ul className="ingredients">
              {cocktail.ingredients.map((ing, i) => (
                <li key={i}>
                  <span className="ing-name">{ing.name}</span>
                  {ing.amount && <span className="ing-amt">{ing.amount}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cocktail.instructions?.length > 0 && (
          <div className="detail-section">
            <h2>Recipe</h2>
            <ol className="steps">
              {cocktail.instructions.map((step, i) => (
                <li key={i}><p>{step}</p></li>
              ))}
            </ol>
          </div>
        )}

        <div className="detail-actions">
          <button className={'btn btn-block ' + (saved ? 'btn-ghost' : 'btn-primary')} onClick={handleSave}>
            <IconBookmark filled={saved} />
            {saved ? 'Saved to library' : 'Save to library'}
          </button>
        </div>

        {cocktail.isCustom && (
          <div className="detail-actions">
            <button className="btn" style={{ flex: 1 }} onClick={() => onEdit?.(cocktail)}>
              <IconEdit /> Edit
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
              <IconTrash /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
