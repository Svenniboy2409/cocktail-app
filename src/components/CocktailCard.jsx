import { Link } from 'react-router-dom'
import { IconBookmark, IconStar, IconClose } from './icons'
import { isSaved, toggleSaved } from '../lib/storage'
import { useI18n } from '../lib/i18n'

export default function CocktailCard({ cocktail, saved, onToggleSave, spirits, ready, onRemove, removeLabel }) {
  const { t, tt } = useI18n()
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
            <IconStar /> {t('Recommended')}
          </span>
        ) : (
          cocktail.isCustom && <span className="card-badge">{t('Mine')}</span>
        )}
        <div className="card-actions">
          {onRemove && (
            <button
              className="card-action"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
              }}
              aria-label={removeLabel}
              title={removeLabel}
            >
              <IconClose />
            </button>
          )}
          <button
            className={'card-action card-save' + (isOn ? ' on' : '')}
            onClick={handleSave}
            aria-label={t(isOn ? 'Remove from library' : 'Save to library')}
          >
            <IconBookmark filled={isOn} />
          </button>
        </div>
        <img src={cocktail.image} alt={cocktail.name} loading="lazy" />
        <div className="card-body">
          <h3>{cocktail.name}</h3>
          <div className="card-tag">{tt(cocktail.tags?.[0] || cocktail.category)}</div>
          {spirits?.length > 0 && (
            <div className={'card-spirits' + (ready ? ' is-complete' : '')}>
              {spirits.map(tt).join(' - ')}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
