// The Discover page's current selection, kept outside the component so it
// survives leaving for a cocktail's detail page and coming back — and so other
// pages can hand Discover a search to run.
export const savedFilters = {
  query: '',
  drinkType: 'All',
  tag: 'All',
  spirit: 'All',
  glass: 'All',
  serve: 'All',
  season: 'All',
  occasion: 'All',
}

// Queue up a fresh search, clearing the filters so nothing narrows it away.
// Discover reads this when it mounts, which is what happens on the way back.
export function searchFor(term) {
  Object.assign(savedFilters, {
    query: term,
    drinkType: 'All',
    tag: 'All',
    spirit: 'All',
    glass: 'All',
    serve: 'All',
    season: 'All',
    occasion: 'All',
  })
}
