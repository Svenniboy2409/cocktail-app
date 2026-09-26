import { useEffect, useMemo, useRef, useState } from 'react'
import { cocktails, spiritsInIngredientOrder } from '../data/cocktails'
import CocktailCard from './CocktailCard'
import { IconSparkle } from './icons'
import { useSavedIds, useUserRecipes, usePantry } from '../lib/hooks'
import { rankCandidates, pickRotating } from '../lib/recommend'
import { useI18n } from '../lib/i18n'

// How often the recommended pair rotates to the next candidates.
const ROTATE_MS = 12000

export default function Recommendations() {
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()
  const pantry = usePantry()
  const { t } = useI18n()

  // Rotation tick — seeded from the clock so the first pair isn't always the
  // same, then advanced on an interval while the page is open.
  const [tick, setTick] = useState(() => Math.floor(Date.now() / ROTATE_MS))
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  // The library = saved cocktails + the user's own recipes. This is the taste
  // signal we blend with the bar.
  const ranked = useMemo(() => {
    const pool = [...recipes, ...cocktails]
    const library = pool.filter((c) => c.isCustom || savedIds.includes(c.id))
    return rankCandidates({ pool, library, savedIds, pantry, seed: tick })
    // `tick` only reshuffles ties; recompute on it so rotation feels lively.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, savedIds, pantry, tick])

  // What the strip was showing a moment ago, so the next turn of it lands on
  // something else.
  const shown = useRef([])
  const picks = useMemo(
    () => pickRotating(ranked, tick, 2, 24, shown.current),
    // `shown` is read, deliberately, without making this depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ranked, tick],
  )
  useEffect(() => {
    shown.current = picks.map((c) => c.id)
  }, [picks])

  if (picks.length < 2) return null

  const hasBar = pantry.length > 0
  const hasTaste = savedIds.length > 0 || recipes.length > 0

  return (
    <section className="recs">
      <div className="recs-head">
        <div className="recs-title">
          <IconSparkle />
          <h2>{t('For your bar')}</h2>
        </div>
        <span className="recs-sub">
          {t(
            hasBar
              ? 'Made with what you have'
              : hasTaste
                ? 'Based on your library'
                : 'A little inspiration',
          )}
        </span>
      </div>

      <div className="recs-grid" key={picks.map((c) => c.id).join('-')}>
        {picks.map((c) => {
          // Spirits this drink uses, in recipe order, and which you own.
          const needed = spiritsInIngredientOrder(c)
          const owned = needed.filter((s) => pantry.includes(s))
          // You can make it right now if you have every spirit it needs.
          const ready = needed.length > 0 && owned.length === needed.length
          return (
            <CocktailCard
              key={c.id}
              cocktail={c}
              saved={savedIds.includes(c.id)}
              spirits={owned}
              ready={ready}
            />
          )
        })}
      </div>

      {!hasBar && (
        <p className="recs-hint">
          {t('Tip: tell us what’s in your bar from the')}{' '}
          <strong>{t('Library')}</strong>{' '}
          {t('tab for recommendations you can actually mix.')}
        </p>
      )}
    </section>
  )
}
