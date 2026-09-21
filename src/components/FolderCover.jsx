import { useMemo } from 'react'
import { cocktails } from '../data/cocktails'
import { useUserRecipes } from '../lib/hooks'
import { IconFolder } from './icons'

// A folder's picture. If the user uploaded one it wins; otherwise the first
// few drinks inside make a collage, so a folder looks like what is in it and
// changes as you fill it. Empty folders fall back to a plain folder mark.
export default function FolderCover({ folder, className = '' }) {
  const { recipes } = useUserRecipes()

  const shots = useMemo(() => {
    if (folder.image) return []
    const pool = [...recipes, ...cocktails]
    return (folder.ids || [])
      .map((id) => pool.find((c) => c.id === id))
      .filter(Boolean)
      .slice(0, 4)
  }, [folder.image, folder.ids, recipes])

  if (folder.image) {
    return (
      <div className={'folder-cover ' + className} data-tiles="1">
        <img src={folder.image} alt="" loading="lazy" />
      </div>
    )
  }

  if (shots.length === 0) {
    return (
      <div className={'folder-cover is-empty ' + className} data-tiles="0">
        <IconFolder />
      </div>
    )
  }

  return (
    <div className={'folder-cover ' + className} data-tiles={shots.length}>
      {shots.map((c) => (
        <img key={c.id} src={c.image} alt="" loading="lazy" />
      ))}
    </div>
  )
}
