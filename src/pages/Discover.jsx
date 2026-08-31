import { useMemo, useState, useEffect } from 'react'
import {
  cocktails,
  TAGS,
  SPIRITS,
  DRINK_TYPES,
  GLASSES,
  SERVES,
  drinkTypeOf,
  spiritsOf,
  glassesOf,
  serveStylesOf,
  keywordsOf,
} from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import Recommendations from '../components/Recommendations'
import FilterChips from '../components/FilterChips'
import FilterSheet from '../components/FilterSheet'
import { IconSearch, IconClose, IconFilters } from '../components/icons'
import { useSavedIds, useUserRecipes } from '../lib/hooks'
import { searchCocktails } from '../lib/search'
import { savedFilters } from '../lib/discoverFilters'

export default function Discover() {
  const [query, setQuery] = useState(savedFilters.query)
  const [drinkType, setDrinkType] = useState(savedFilters.drinkType)
  const [tag, setTag] = useState(savedFilters.tag)
  const [spirit, setSpirit] = useState(savedFilters.spirit)
  const [glass, setGlass] = useState(savedFilters.glass)
  const [serve, setServe] = useState(savedFilters.serve)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()

  // Remember the current selection for when we come back to this page.
  useEffect(() => {
    Object.assign(savedFilters, { query, drinkType, tag, spirit, glass, serve })
  }, [query, drinkType, tag, spirit, glass, serve])

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
    const chosen = all.filter((c) => {
      const matchType = drinkType === 'All' || drinkTypeOf(c) === drinkType
      const matchTag = tag === 'All' || c.tags?.includes(tag)
      const matchSpirit =
        spirit === 'All' || spiritsOf(c).includes(spirit) || c.category === spirit
      const matchGlass = glass === 'All' || glassesOf(c).includes(glass)
      const matchServe = serve === 'All' || serveStylesOf(c).includes(serve)
      return matchType && matchTag && matchSpirit && matchGlass && matchServe
    })
    // Typo-tolerant, word-boundary search; best match first, and the list is
    // left in its usual fame order when the search box is empty.
    return searchCocktails(chosen, query, keywordsOf)
  }, [all, query, drinkType, tag, spirit, glass, serve])

  // Everything the sheet offers, in the order it shows them.
  const groups = [
    { label: 'Type', allLabel: 'All types', options: DRINK_TYPES, value: drinkType, onChange: setDrinkType },
    { label: 'Style', allLabel: 'All styles', options: TAGS, value: tag, onChange: setTag },
    { label: 'Base spirit', allLabel: 'All base spirits', options: spirits, value: spirit, onChange: setSpirit },
    { label: 'Glass', allLabel: 'All glasses', options: GLASSES, value: glass, onChange: setGlass },
    { label: 'Serve', allLabel: 'All serves', options: SERVES, value: serve, onChange: setServe },
  ]

  const activeCount = groups.filter((g) => g.value !== 'All').length
  const hasFilters = activeCount > 0 || query.trim() !== ''

  const clearFilters = () => {
    groups.forEach((g) => g.onChange('All'))
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

      <div className="search-row">
        <div className="search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search a drink, ingredient or country…"
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
        <button
          className={'filter-toggle' + (activeCount ? ' on' : '')}
          onClick={() => setFiltersOpen(true)}
          aria-label="Open filters"
        >
          <IconFilters />
          {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
        </button>
      </div>

      {/* The two everyday filters stay on the page; the rest live in the sheet. */}
      {groups.slice(0, 2).map((g) => (
        <div className="filter-group" key={g.label}>
          <FilterChips
            allLabel={g.allLabel}
            options={g.options}
            value={g.value}
            onChange={g.onChange}
          />
        </div>
      ))}

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

      {filtersOpen && (
        <FilterSheet
          groups={groups}
          count={filtered.length}
          hasFilters={hasFilters}
          onClear={clearFilters}
          onClose={() => setFiltersOpen(false)}
        />
      )}
    </div>
  )
}
