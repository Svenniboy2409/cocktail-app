import { useMemo, useState } from 'react'
import { cocktails, TAGS, SPIRITS } from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import Recommendations from '../components/Recommendations'
import { IconSearch } from '../components/icons'
import { useSavedIds, useUserRecipes } from '../lib/hooks'

export default function Discover() {
  const [query, setQuery] = useState('')
  const [spirit, setSpirit] = useState('All')
  const [tag, setTag] = useState('All')
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()

  const all = useMemo(() => [...recipes, ...cocktails], [recipes])

  // Spirit list = curated spirits plus any categories from the user's own
  // recipes that aren't already covered, so custom drinks are filterable too.
  const spirits = useMemo(() => {
    const extra = recipes
      .map((r) => r.category)
      .filter((c) => c && !SPIRITS.includes(c))
    return [...SPIRITS, ...Array.from(new Set(extra)).sort()]
  }, [recipes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((c) => {
      const matchSpirit = spirit === 'All' || c.category === spirit
      const matchTag = tag === 'All' || c.tags?.includes(tag)
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.ingredients?.some((i) => i.name.toLowerCase().includes(q))
      return matchSpirit && matchTag && matchQuery
    })
  }, [all, query, spirit, tag])

  const hasFilters = spirit !== 'All' || tag !== 'All' || query.trim() !== ''

  const clearFilters = () => {
    setSpirit('All')
    setTag('All')
    setQuery('')
  }

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <div className="eyebrow">Mixly</div>
          <h1>Discover</h1>
          <div className="sub">Find your next favourite pour</div>
        </div>
      </header>

      <Recommendations />

      <div className="search">
        <IconSearch />
        <input
          type="text"
          placeholder="Search cocktails or ingredients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <div className="filter-label">Style</div>
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
      </div>

      <div className="filter-group">
        <div className="filter-label">Base spirit</div>
        <div className="chips">
          {['All', ...spirits].map((s) => (
            <button
              key={s}
              className={'chip' + (spirit === s ? ' active' : '')}
              onClick={() => setSpirit(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="result-bar">
        <span>
          {filtered.length} {filtered.length === 1 ? 'cocktail' : 'cocktails'}
        </span>
        {hasFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        )}
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
