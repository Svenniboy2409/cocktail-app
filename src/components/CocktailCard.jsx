import { Link } from 'react-router-dom'
import { IconBookmark, IconStar } from './icons'
import { isSaved, toggleSaved } from '../lib/storage'

export default function CocktailCard({ cocktail, saved, onToggleSave, spirits, ready }) {
  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const now = toggleSaved(cocktail.id)
    onToggleSave?.(cocktail.id, now)
  }

  const isOn = saved ?? isSaved(cocktail.id)

  return (
    <Link className="card" to={`/cocktail/${cocktail.id}`}>
      <div className="card-media">
        {ready ? (
          <span className="card-badge recommended">
            <IconStar /> Recommended
          </span>
        ) : (
          cocktail.isCustom && <span className="card-badge">Mine</span>
        )}
        <button
          className={'card-save' + (isOn ? ' on' : '')}
          onClick={handleSave}
          aria-label={isOn ? 'Remove from library' : 'Save to library'}
        >
          <IconBookmark filled={isOn} />
        </button>
        <img src={cocktail.image} alt={cocktail.name} loading="lazy" />
        <div className="card-body">
          <h3>{cocktail.name}</h3>
          <div className="card-tag">{cocktail.tags?.[0] || cocktail.category}</div>
          {spirits?.length > 0 && (
            <div className={'card-spirits' + (ready ? ' is-complete' : '')}>
              {spirits.join(' - ')}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
