import { useMemo, useState, useEffect, useRef } from 'react'
import {
  cocktails,
  TAGS,
  SPIRITS,
  DRINK_TYPES,
  GLASSES,
  SERVES,
  SEASONS_PRESENT,
  OCCASIONS_PRESENT,
  drinkTypeOf,
  spiritsOf,
  glassesOf,
  serveStylesOf,
  seasonsOf,
  occasionsOf,
  keywordsOf,
} from '../data/cocktails'
import CocktailCard from '../components/CocktailCard'
import Recommendations from '../components/Recommendations'
import FilterChips from '../components/FilterChips'
import FilterSheet from '../components/FilterSheet'
import { IconSearch, IconClose, IconFilters } from '../components/icons'
import { useSavedIds } from '../lib/hooks'
import { searchCocktails } from '../lib/search'
import { useI18n } from '../lib/i18n'
import { savedFilters } from '../lib/discoverFilters'
import { useVisibleCount } from '../lib/useVisibleCount'
import { getScroller } from '../lib/scroller'

// Is the search row riding along at the top of the page rather than sitting in
// its own place? A marker just above it answers that: once the marker has
// scrolled past the top of the page, the row is holding on there instead.
// The row's own `top` offset is read off it, so the answer changes at the exact
// moment it starts to stick rather than a status bar's height later.
function useStuck(rowRef) {
  const [stuck, setStuck] = useState(false)
  const markerRef = useRef(null)
  // Turning the screen changes the inset, and with it where the row settles,
  // so the observer is made again rather than left watching the old line.
  const [epoch, setEpoch] = useState(0)
  useEffect(() => {
    const bump = () => setEpoch((n) => n + 1)
    window.addEventListener('resize', bump)
    window.addEventListener('orientationchange', bump)
    return () => {
      window.removeEventListener('resize', bump)
      window.removeEventListener('orientationchange', bump)
    }
  }, [])
  useEffect(() => {
    const marker = markerRef.current
    const row = rowRef.current
    if (!marker || !row) return undefined
    const top = parseFloat(getComputedStyle(row).top) || 0
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      root: getScroller(),
      rootMargin: `-${Math.ceil(top) + 1}px 0px 0px 0px`,
    })
    io.observe(marker)
    return () => io.disconnect()
  }, [rowRef, epoch])
  return [stuck, markerRef]
}

export default function Discover() {
  const [query, setQuery] = useState(savedFilters.query)
  const [drinkType, setDrinkType] = useState(savedFilters.drinkType)
  const [tag, setTag] = useState(savedFilters.tag)
  const [spirit, setSpirit] = useState(savedFilters.spirit)
  const [glass, setGlass] = useState(savedFilters.glass)
  const [serve, setServe] = useState(savedFilters.serve)
  const [season, setSeason] = useState(savedFilters.season)
  const [occasion, setOccasion] = useState(savedFilters.occasion)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const savedIds = useSavedIds()
  const { t, tt } = useI18n()
  const searchRef = useRef(null)
  const [stuck, markerRef] = useStuck(searchRef)

  // Remember the current selection for when we come back to this page.
  useEffect(() => {
    Object.assign(savedFilters, { query, drinkType, tag, spirit, glass, serve, season, occasion })
  }, [query, drinkType, tag, spirit, glass, serve, season, occasion])

  // Discover is for finding drinks you don't know yet. Your own recipes are
  // not that — you wrote them — so they stay in the Library.
  const filtered = useMemo(() => {
    const chosen = cocktails.filter((c) => {
      const matchType = drinkType === 'All' || drinkTypeOf(c) === drinkType
      const matchTag = tag === 'All' || c.tags?.includes(tag)
      const matchSpirit =
        spirit === 'All' || spiritsOf(c).includes(spirit) || c.category === spirit
      const matchGlass = glass === 'All' || glassesOf(c).includes(glass)
      const matchServe = serve === 'All' || serveStylesOf(c).includes(serve)
      const matchSeason = season === 'All' || seasonsOf(c).includes(season)
      const matchOccasion = occasion === 'All' || occasionsOf(c).includes(occasion)
      return (
        matchType && matchTag && matchSpirit && matchGlass && matchServe &&
        matchSeason && matchOccasion
      )
    })
    // Typo-tolerant, word-boundary search; best match first, and the list is
    // left in its usual fame order when the search box is empty.
    return searchCocktails(chosen, query, keywordsOf)
  }, [query, drinkType, tag, spirit, glass, serve, season, occasion])

  // Everything the sheet offers, in the order it shows them.
  const groups = [
    { label: 'Type', allLabel: 'All types', options: DRINK_TYPES, value: drinkType, onChange: setDrinkType },
    { label: 'Style', allLabel: 'All styles', options: TAGS, value: tag, onChange: setTag },
    { label: 'Season', allLabel: 'All year round', options: SEASONS_PRESENT, value: season, onChange: setSeason },
    { label: 'Occasion', allLabel: 'Any occasion', options: OCCASIONS_PRESENT, value: occasion, onChange: setOccasion },
    { label: 'Base spirit', allLabel: 'All base spirits', options: SPIRITS, value: spirit, onChange: setSpirit },
    { label: 'Glass', allLabel: 'All glasses', options: GLASSES, value: glass, onChange: setGlass },
    { label: 'Serve', allLabel: 'All serves', options: SERVES, value: serve, onChange: setServe },
  ]

  // The list grows as it is scrolled rather than putting all 476 cards in the
  // page at once; a new search or filter starts it over.
  const [shown, sentinel] = useVisibleCount(
    filtered.length,
    [query, drinkType, tag, spirit, glass, serve, season, occasion].join('\u0000'),
  )

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
          <h1>{t('Discover')}</h1>
          <div className="sub">{t('Find your next favourite pour')}</div>
        </div>
      </header>

      <Recommendations />

      <div className="stick-marker" ref={markerRef} />
      <div className={'search-row' + (stuck ? ' is-stuck' : '')} ref={searchRef}>
        <div className="search">
          <IconSearch />
          <input
            type="text"
            placeholder={t('Search a drink, ingredient or country…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {hasFilters && (
            <button
              className="search-clear"
              onClick={clearFilters}
              aria-label={t('Clear search and filters')}
            >
              <IconClose />
            </button>
          )}
        </div>
        <button
          className={'filter-toggle' + (activeCount ? ' on' : '')}
          onClick={() => setFiltersOpen(true)}
          aria-label={t('Open filters')}
        >
          <IconFilters />
          {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
        </button>
      </div>

      {/* The two everyday filters stay on the page; the rest live in the sheet. */}
      {groups.slice(0, 2).map((g) => (
        <div className="filter-group" key={g.label}>
          <FilterChips
            allLabel={t(g.allLabel)}
            options={g.options}
            label={tt}
            value={g.value}
            onChange={g.onChange}
          />
        </div>
      ))}

      <div className="result-bar">
        <span>
          {filtered.length} {t(filtered.length === 1 ? 'cocktail' : 'cocktails')}
        </span>
        {hasFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            {t('Clear filters')}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="icon">🍸</div>
          <h3>{t('No cocktails found')}</h3>
          <p>{t('Try a different search or filter.')}</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {filtered.slice(0, shown).map((c) => (
              <CocktailCard key={c.id} cocktail={c} saved={savedIds.includes(c.id)} />
            ))}
          </div>
          {shown < filtered.length && <div className="grid-sentinel" ref={sentinel} />}
        </>
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
