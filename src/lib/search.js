// Forgiving search for the Discover page.
//
// Two things a plain `includes()` gets wrong. It matches inside words, so
// "apple" also returns every pineapple drink; and it returns nothing at all
// the moment a letter is off, so "margerita" finds no Margarita. This module
// matches at word boundaries instead, and falls back to a bounded edit
// distance so ordinary typos and spelling slips still land on the right drink.

// Lowercase, strip accents, and reduce everything else to single spaces, so
// "Piña Colada", "pina colada" and "PINA-COLADA" are all the same query.
export function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// How many mistakes we forgive in one word. Two letters or fewer is too
// little to guess from; three gets one mistake but must still start with the
// same letter (see below), which is what rescues "whiskey sur".
function tolerance(term) {
  if (term.length <= 2) return 0
  if (term.length <= 6) return 1
  return 2
}

// Damerau-Levenshtein distance, abandoned as soon as it is certain to exceed
// `max`. Swapping two neighbouring letters — "mojtio" for "mojito" — is one of
// the commonest typos there is, so it counts as a single mistake, not two.
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const n = b.length
  let prev2 = null
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array(n + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    let rowMin = curr[0]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1)
      }
      curr[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev2 = prev
    prev = curr
    curr = new Array(n + 1)
  }
  return prev[n]
}

// How well one search term matches one list of words. 0 means no match;
// higher is a better match, so an exact word always outranks a typo.
function termScore(term, words) {
  let best = 0
  const tol = tolerance(term)
  // On very short terms one mistake is most of the word, so tighten up: the
  // first letter has to be right, and we only compare whole words. That keeps
  // "sur" reaching "sour" without it also dragging in sugar and syrup.
  const short = term.length <= 3
  for (const word of words) {
    if (word === term) return 6
    // Prefix match, so half-typed words find their drink while you type.
    if (word.startsWith(term)) {
      best = Math.max(best, 5)
      continue
    }
    if (!tol || best >= 4) continue
    if (short && word[0] !== term[0]) continue
    // Compare against the head of the word as well as the whole word, so a
    // typo in a half-typed term ("margerit") still reaches "margarita".
    let d = short ? tol + 1 : editDistance(term, word.slice(0, term.length), tol)
    if (d > tol) d = editDistance(term, word, tol)
    if (d <= tol) best = Math.max(best, 4 - d)
  }
  return best
}

// The words we match a drink on, worked out once per drink and remembered.
const indexCache = new WeakMap()

function indexOf(cocktail) {
  let entry = indexCache.get(cocktail)
  if (entry) return entry

  const name = normalize(cocktail.name)
  const nameWords = name.split(' ').filter(Boolean)
  // Also index the name with its spaces removed, so "espressomartini" works.
  if (nameWords.length > 1) nameWords.push(nameWords.join(''))

  entry = {
    name,
    nameWords,
    categoryWords: normalize(cocktail.category).split(' ').filter(Boolean),
    ingredientWords: Array.from(
      new Set(
        (cocktail.ingredients || [])
          .flatMap((i) => normalize(i.name).split(' '))
          .filter(Boolean),
      ),
    ),
  }
  indexCache.set(cocktail, entry)
  return entry
}

// Score one drink against the already-normalised query terms.
// Returns 0 when any term fails to match anywhere — all terms must land.
function score(cocktail, terms, query) {
  const idx = indexOf(cocktail)
  let total = 0
  for (const term of terms) {
    const best = Math.max(
      termScore(term, idx.nameWords) * 10,
      termScore(term, idx.categoryWords) * 4,
      termScore(term, idx.ingredientWords) * 3,
    )
    if (!best) return 0
    total += best
  }
  // A drink whose name is what you actually typed belongs at the very top.
  if (idx.name === query) total += 100
  else if (idx.name.startsWith(query)) total += 50
  return total
}

// Filter a list of drinks by a free-text query, best match first. An empty
// query returns the list untouched, so the normal fame ordering survives.
export function searchCocktails(cocktails, query) {
  const q = normalize(query)
  if (!q) return cocktails

  const terms = q.split(' ')
  const hits = []
  cocktails.forEach((cocktail, order) => {
    const s = score(cocktail, terms, q)
    if (s > 0) hits.push({ cocktail, s, order })
  })
  // Equally good matches keep their original order, which is by fame.
  hits.sort((a, b) => b.s - a.s || a.order - b.order)
  return hits.map((h) => h.cocktail)
}
