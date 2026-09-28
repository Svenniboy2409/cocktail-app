import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAccount } from '../lib/account'
import { useI18n } from '../lib/i18n'
import { addRecipe } from '../lib/storage'
import { useToast } from '../components/Toast'
import { IconBack, IconGlass, IconGarnish, IconDownload } from '../components/icons'
import { cachedShared } from './Social'

// A cocktail a friend made and shared: the whole recipe, to make, and to keep.
export default function SharedCocktail() {
  const { owner, id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { t, tt } = useI18n()
  const account = useAccount()
  const [cocktail, setCocktail] = useState(() => cachedShared(owner, id))
  const [missing, setMissing] = useState(false)
  const [kept, setKept] = useState(false)

  // Opened from a link or after a reload, there is no list to take it from.
  useEffect(() => {
    if (cocktail || account.status !== 'ready' || !account.api) return
    account.api
      .sharedRecipe(owner, id)
      .then((c) => (c ? setCocktail(c) : setMissing(true)))
      .catch(() => setMissing(true))
  }, [cocktail, account.status, account.api, owner, id])

  if (!cocktail) {
    if (!missing && account.status !== 'signedOut') return <div className="page" />
    return (
      <div className="page">
        <div className="empty">
          <div className="icon">🤔</div>
          <h3>{t('This cocktail is no longer shared')}</h3>
          <Link className="btn btn-primary" to="/social">
            {t('Back to Social')}
          </Link>
        </div>
      </div>
    )
  }

  // A copy into your own recipes — yours from then on, to change as you like.
  const keep = async () => {
    await addRecipe({
      name: cocktail.name,
      image: cocktail.image,
      category: cocktail.category,
      tags: cocktail.tags || [],
      scenario: cocktail.scenario,
      glass: cocktail.glass,
      garnish: cocktail.garnish,
      ingredients: cocktail.ingredients || [],
      instructions: cocktail.instructions || [],
      from: cocktail.ownerName,
      // A copy starts private: sharing someone else's recipe on as your own
      // is a choice to make, not a default.
      shared: false,
    })
    setKept(true)
    showToast(t('Added to My recipes'))
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
          <div className="by-line">
            <div className="profile-avatar">{(cocktail.ownerName || '?').slice(0, 1).toUpperCase()}</div>
            {t('Created by @{name}', { name: cocktail.ownerName })}
          </div>
          {cocktail.tags?.length > 0 && (
            <div className="detail-meta-row" style={{ marginTop: 10 }}>
              {cocktail.tags.map((tag) => (
                <span className="pill" key={tag}>
                  {tt(tag)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="detail-body">
        {cocktail.scenario && (
          <div className="scenario">
            <span className="q">“</span>
            <p>{cocktail.scenario}</p>
          </div>
        )}

        {(cocktail.glass || cocktail.garnish) && (
          <div className="detail-meta-row" style={{ marginBottom: 26 }}>
            {cocktail.glass && (
              <span className="pill">
                <IconGlass style={{ verticalAlign: '-4px', marginRight: 6 }} />
                {cocktail.glass}
              </span>
            )}
            {cocktail.garnish && (
              <span className="pill">
                <IconGarnish style={{ verticalAlign: '-4px', marginRight: 6 }} />
                {cocktail.garnish}
              </span>
            )}
          </div>
        )}

        {cocktail.ingredients?.length > 0 && (
          <div className="detail-section">
            <h2>{t('Ingredients')}</h2>
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
            <h2>{t('Recipe')}</h2>
            <ol className="steps">
              {cocktail.instructions.map((step, i) => (
                <li key={i}>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="detail-actions">
          <button
            className={'btn btn-block ' + (kept ? 'btn-on' : 'btn-primary')}
            onClick={keep}
            disabled={kept}
          >
            <IconDownload /> {t(kept ? 'In My recipes' : 'Save a copy to My recipes')}
          </button>
        </div>
      </div>
    </div>
  )
}
