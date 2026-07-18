// Personal cocktail recommendations.
//
// We build a lightweight "taste profile" from the cocktails in the user's
// library (saved + their own recipes): which base spirits, styles (tags) and
// ingredients they clearly enjoy. We then score the wider catalogue against
// that profile *and* against the spirits they actually have at home ("your
// bar"), and rank the results.
//
// The Discover strip shows two of these at a time and rotates through the top
// candidates over time, so the suggestions stay fresh and varied.

const normalise = (s) => (s || '').trim().toLowerCase()

// Turn the library into weighted buckets of tastes.
export function buildProfile(libraryItems) {
  const spirits = {}
  const tags = {}
  const ingredients = {}
  for (const c of libraryItems) {
    if (c.category) spirits[c.category] = (spirits[c.category] || 0) + 1
    for (const t of c.tags || []) tags[t] = (tags[t] || 0) + 1
    for (const ing of c.ingredients || []) {
      const key = normalise(ing.name)
      if (key) ingredients[key] = (ingredients[key] || 0) + 1
    }
  }
  return { spirits, tags, ingredients }
}

function scoreCocktail(cocktail, profile, pantrySet) {
  let score = 0

  // You can actually make it with what's on your shelf — the strongest signal.
  if (pantrySet.size && cocktail.category && pantrySet.has(cocktail.category)) {
    score += 6
  }

  // You've saved other cocktails with the same base spirit.
  if (cocktail.category && profile.spirits[cocktail.category]) {
    score += Math.min(profile.spirits[cocktail.category], 3) * 1.5
  }

  // Shared style / mood.
  for (const t of cocktail.tags || []) {
    if (profile.tags[t]) score += Math.min(profile.tags[t], 3) * 1
  }

  // Shared ingredients (lime juice, simple syrup, bitters…).
  for (const ing of cocktail.ingredients || []) {
    if (profile.ingredients[normalise(ing.name)]) score += 0.5
  }

  return score
}

// Deterministic small shuffle so equally-scored cocktails don't always show in
// the same order. Seeded, so it's stable within a render.
function seededOrder(items, seed) {
  return items
    .map((item, i) => ({ item, k: Math.sin(seed * 999 + i * 37.7) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item)
}

// Rank the catalogue for this user. Returns the best candidates first.
export function rankCandidates({ pool, library, savedIds, pantry, seed = 0 }) {
  const profile = buildProfile(library)
  const pantrySet = new Set(pantry)
  const savedSet = new Set(savedIds)

  // Recommend fresh discoveries: skip cocktails already in the library and the
  // user's own creations.
  let candidates = pool.filter((c) => !savedSet.has(c.id) && !c.isCustom)

  // If the user told us what's in their bar, focus on makeable cocktails —
  // but relax the filter if that leaves us with too few to choose from.
  if (pantrySet.size) {
    const makeable = candidates.filter((c) => c.category && pantrySet.has(c.category))
    if (makeable.length >= 2) candidates = makeable
  }

  const scored = candidates.map((c) => ({ c, s: scoreCocktail(c, profile, pantrySet) }))

  // Break score ties with a seeded shuffle so the pool feels alive.
  const shuffled = seededOrder(scored, seed)
  shuffled.sort((a, b) => b.s - a.s)

  return shuffled.map((x) => x.c)
}

// Pick `count` cocktails from the ranked list for a given rotation tick.
// We keep a window of the best `poolSize` candidates and slide a pair through
// it, so suggestions rotate among strong matches rather than drifting to weak
// ones.
export function pickRotating(ranked, tick, count = 2, poolSize = 6) {
  if (ranked.length <= count) return ranked
  const window = ranked.slice(0, Math.min(poolSize, ranked.length))
  const start = ((tick % window.length) + window.length) % window.length
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(window[(start + i) % window.length])
  }
  return out
}
