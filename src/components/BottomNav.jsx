import { NavLink } from 'react-router-dom'
import { IconCompass, IconLibrary } from './icons'

export default function BottomNav({ onCreate }) {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="nav-item">
        <IconCompass />
        <span>Discover</span>
      </NavLink>

      <div className="fab-wrap">
        <button className="fab" onClick={onCreate} aria-label="Create a recipe" />
      </div>

      <NavLink to="/library" className="nav-item">
        <IconLibrary />
        <span>Library</span>
      </NavLink>
    </nav>
  )
}
