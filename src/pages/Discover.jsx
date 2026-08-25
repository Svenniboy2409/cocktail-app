import { useMemo, useState, useEffect } from 'react'
import {
  cocktails,
  TAGS,
  SPIRITS,
  DRINK_TYPES,
  SERVES,
  drinkTypeOf,
  spiritsOf,
  serveStylesOf,
} from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import Recommendations from '../components/Recommendations'
import { IconSearch, IconClose } from '../components/icons'
import { useSavedIds, useUserRecipes } from '../lib/hooks'

// Kept at module scope so the chosen filters survive leaving Discover for a
// cocktail's detail page and coming back.
const savedFilters = { query: '', drinkType: 'All', tag: 'All', spirit: 'All', serve: 'All' }

// One scrolling row of filter chips. The "All" chip carries the row's name, so
// the rows need no headings above them.
function FilterRow({ allLabel, options, value, onChange }) {
  return (
    <div className="filter-group">
      <div className="chips">
        <button
          className={'chip' + (value === 'All' ? ' active' : '')}
          onClick={() => onChange('All')}
        >
          {allLabel}
        </button>
        {options.map((o) => (
          <button
            key={o}
            className={'chip' + (value === o ? ' active' : '')}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Discover() {
  const [query, setQuery] = useState(savedFilters.query)
  const [drinkType, setDrinkType] = useState(savedFilters.drinkType)
  const [tag, setTag] = useState(savedFilters.tag)
  const [spirit, setSpirit] = useState(savedFilters.spirit)
  const [serve, setServe] = useState(savedFilters.serve)
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()

  // Remember the current selection for when we come back to this page.
  useEffect(() => {
    Object.assign(savedFilters, { query, drinkType, tag, spirit, serve })
  }, [query, drinkType, tag, spirit, serve])

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
      const matchType = drinkType === 'All' || drinkTypeOf(c) === drinkType
      const matchTag = tag === 'All' || c.tags?.includes(tag)
      const matchSpirit =
        spirit === 'All' || spiritsOf(c).includes(spirit) || c.category === spirit
      const matchServe = serve === 'All' || serveStylesOf(c).includes(serve)
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.ingredients?.some((i) => i.name.toLowerCase().includes(q))
      return matchType && matchTag && matchSpirit && matchServe && matchQuery
    })
  }, [all, query, drinkType, tag, spirit, serve])

  const hasFilters =
    drinkType !== 'All' ||
    tag !== 'All' ||
    spirit !== 'All' ||
    serve !== 'All' ||
    query.trim() !== ''

  const clearFilters = () => {
    setDrinkType('All')
    setTag('All')
    setSpirit('All')
    setServe('All')
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
        {hasFilters && (
          <button
            className="search-clear"
            onClick={clearFilters}
            aria-label="Clear search and filters"
          >
            <IconClose />
          </button>
        )}
      </div>

      <FilterRow allLabel="All types" options={DRINK_TYPES} value={drinkType} onChange={setDrinkType} />
      <FilterRow allLabel="All styles" options={TAGS} value={tag} onChange={setTag} />
      <FilterRow allLabel="All base spirits" options={spirits} value={spirit} onChange={setSpirit} />
      <FilterRow allLabel="All serves" options={SERVES} value={serve} onChange={setServe} />

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
