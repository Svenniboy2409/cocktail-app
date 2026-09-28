import { NavLink } from 'react-router-dom'
import { IconCompass, IconLibrary, IconFriends } from './icons'
import { useI18n } from '../lib/i18n'
import { useAccount } from '../lib/account'

export default function BottomNav({ onCreate }) {
  const { t } = useI18n()
  // Social only appears once the app has a Firebase project to talk to.
  const account = useAccount({ load: false })
  const waiting = account.requests.incoming.length

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="nav-item">
        <IconCompass />
        <span>{t('Discover')}</span>
      </NavLink>

      {account.configured && (
        <NavLink to="/social" className="nav-item">
          <IconFriends />
          <span>{t('Social')}</span>
          {waiting > 0 && (
            <span className="nav-badge" aria-label={t('{n} friend requests', { n: waiting })}>
              {waiting}
            </span>
          )}
        </NavLink>
      )}

      <div className="fab-wrap">
        <button className="fab" onClick={onCreate} aria-label={t('Create a recipe')} />
      </div>

      <NavLink to="/library" className="nav-item">
        <IconLibrary />
        <span>{t('Library')}</span>
      </NavLink>
    </nav>
  )
}
