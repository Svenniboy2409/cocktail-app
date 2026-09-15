import { NavLink } from 'react-router-dom'
import { IconCompass, IconLibrary } from './icons'
import { useI18n } from '../lib/i18n'

export default function BottomNav({ onCreate }) {
  const { t } = useI18n()
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="nav-item">
        <IconCompass />
        <span>{t('Discover')}</span>
      </NavLink>

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
