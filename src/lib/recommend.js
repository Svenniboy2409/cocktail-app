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

import { spiritsOf } from '../data/cocktails'

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

  // You have one of its spirits on your shelf — the strongest signal.
  if (pantrySet.size && spiritsOf(cocktail).some((s) => pantrySet.has(s))) {
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

// A seeded random number generator (mulberry32). The same seed always gives
// the same sequence, so a render is reproducible and the strip does not
// reshuffle under your finger — but the numbers are genuinely spread across
// the range.
//
// This replaces a sine trick that looked like a shuffle and was not one: the
// step it used, 37.7, sits within a thousandth of 12π, so sin(seed + i · 37.7)
// climbed almost straight up as i grew and sorting by it simply returned the
// list, or the list backwards. Every tick produced the same order, which is
// why the same handful of drinks kept coming round.
function seededRandom(seed) {
  let a = (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ 0xc2b2ae35) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher–Yates, drawing from a seeded generator.
function seededOrder(items, seed) {
  const out = [...items]
  const next = seededRandom(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
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
    const makeable = candidates.filter((c) => spiritsOf(c).some((s) => pantrySet.has(s)))
    if (makeable.length >= 2) candidates = makeable
  }

  const scored = candidates.map((c) => ({ c, s: scoreCocktail(c, profile, pantrySet) }))

  // Break score ties with a seeded shuffle so the pool feels alive.
  const shuffled = seededOrder(scored, seed)
  shuffled.sort((a, b) => b.s - a.s)

  return shuffled.map((x) => x.c)
}

// Pick `count` cocktails from the ranked list for a given rotation tick.
//
// The window is still the strongest matches rather than the whole catalogue,
// so what you are shown is something you can actually pour — but which of them
// you get is drawn fresh each tick instead of stepped through in order, and
// the window is wide enough that a bar with a few bottles in it has real
// choice. Whatever was on screen a moment ago is held back, so two ticks
// running do not repeat while there is anything else to show.
export function pickRotating(ranked, tick, count = 2, poolSize = 24, seen = []) {
  if (ranked.length <= count) return ranked
  const recent = new Set(seen)
  const fresh = ranked.filter((c) => !recent.has(c.id))
  const list = fresh.length >= count ? fresh : ranked
  const window = list.slice(0, Math.min(poolSize, list.length))
  return seededOrder(window, tick + 1).slice(0, count)
}
