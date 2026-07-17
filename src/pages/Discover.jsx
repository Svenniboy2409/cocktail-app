import { useMemo, useState } from 'react'
import { cocktails, TAGS } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import { IconSearch } from '../components/icons'
import { useSavedIds, useUserRecipes } from '../lib/hooks'

export default function Discover() {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('All')
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()

  const all = useMemo(() => [...recipes, ...cocktails], [recipes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((c) => {
      const matchTag = tag === 'All' || c.tags?.includes(tag)
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.ingredients?.some((i) => i.name.toLowerCase().includes(q))
      return matchTag && matchQuery
    })
  }, [all, query, tag])

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <div className="eyebrow">Mixly</div>
          <h1>Discover</h1>
          <div className="sub">Find your next favourite pour</div>
        </div>
      </header>

      <div className="search">
        <IconSearch />
        <input
          type="text"
          placeholder="Search cocktails or ingredients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chips">
        {['All', ...TAGS].map((t) => (
          <button
            key={t}
            className={'chip' + (tag === t ? ' active' : '')}
            onClick={() => setTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="icon">🍸</div>
          <h3>No cocktails found</h3>
          <p>Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((c) => (
            <CocktailCard key={c.id} cocktail={c} saved={savedIds.includes(c.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
