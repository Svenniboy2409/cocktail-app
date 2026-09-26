import { Link } from 'react-router-dom'
import { IconBookmark, IconStar } from './icons'
import { isSaved, toggleSaved } from '../lib/storage'
import { useI18n } from '../lib/i18n'

export default function CocktailCard({ cocktail, saved, onToggleSave, spirits, ready, linkTo, still }) {
  const { t, tt } = useI18n()
  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const now = toggleSaved(cocktail.id)
    onToggleSave?.(cocktail.id, now)
  }

  const isOn = saved ?? isSaved(cocktail.id)

  // While a folder is being rearranged the cards are things you drag, not
  // links you follow, and the bookmark would only get in the way.
  const Shell = still ? 'div' : Link
  const shellProps = still ? {} : { to: linkTo || `/cocktail/${cocktail.id}` }

  return (
    <Shell className="card" {...shellProps}>
      <div className="card-media">
        {/* Badge and bookmark share one row rather than being pinned to
            opposite corners, so a long label cannot run underneath the
            button. */}
        <div className="card-top">
          {ready ? (
            <span className="card-badge recommended">
              <IconStar width="11" height="11" /> {t('Recommended')}
            </span>
          ) : (
            cocktail.isCustom && <span className="card-badge">{t('Mine')}</span>
          )}
          {!still && (
            <button
              className={'card-save' + (isOn ? ' on' : '')}
              onClick={handleSave}
              aria-label={t(isOn ? 'Remove from library' : 'Save to library')}
            >
              <IconBookmark filled={isOn} />
            </button>
          )}
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
    </Shell>
  )
}
