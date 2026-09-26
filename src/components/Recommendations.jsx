import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react'
import { cocktails, spiritsInIngredientOrder } from '../data/cocktails'
import CocktailCard from './CocktailCard'
import { IconSparkle } from './icons'
import { useSavedIds, useUserRecipes, usePantry } from '../lib/hooks'
import { rankCandidates, pickRotating } from '../lib/recommend'
import { useI18n } from '../lib/i18n'

// How fast the belt walks, in pixels a second. Slow enough to read a label on
// the way past, quick enough that you can see it is moving without waiting.
const SPEED = 16
// Enough drinks to cover a phone with a tile to spare at each end. A wider
// screen fits more across, and tops this up once the belt has been measured.
const MIN_SEATS = 6
// How far down the ranking the belt draws from. The scores across the top of
// the list sit within a point or two of each other, so this is a band of
// comparable matches rather than a ladder.
const WINDOW = 24
// Without animation, how long each drink stays before the belt steps on.
const STEP_MS = 12000

// One ordering per launch, so the belt does not open on the same drinks every
// time the app does.
const SEED = Math.floor(Date.now() / 1000)

// Where the belt had got to. Discover unmounts when you go to another tab, and
// coming back to a band that had silently jumped somewhere else would read as a
// glitch rather than as the pause it is — so its place is kept here, outside
// the component, and picked up again on the way back.
const parked = { key: '', ids: [], offset: 0 }

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Recommendations() {
  const savedIds = useSavedIds()
  const { recipes } = useUserRecipes()
  const pantry = usePantry()
  const { t } = useI18n()

  // The library = saved cocktails + the user's own recipes. This is the taste
  // signal we blend with the bar.
  const ranked = useMemo(() => {
    const pool = [...recipes, ...cocktails]
    const library = pool.filter((c) => c.isCustom || savedIds.includes(c.id))
    return rankCandidates({ pool, library, savedIds, pantry, seed: SEED })
  }, [recipes, savedIds, pantry])

  const seats = useRef([]) // [{ seat, cocktail }] — what is on the belt now
  const supply = useRef([]) // drinks queued up to come on next
  const pass = useRef(0) // which shuffle of the window the supply came from
  const nextSeat = useRef(0)
  const offset = useRef(0) // how far the belt has travelled, in pixels
  const stride = useRef(0) // one card plus one gap
  const held = useRef(false) // a finger is down: hold still so it can be tapped
  const rewind = useRef(0) // travel owed back once the re-cut row is on screen
  const built = useRef(null)
  const trackRef = useRef(null)
  const [, redraw] = useReducer((n) => n + 1, 0)

  // Take the next drink, refilling from a fresh shuffle of the window when the
  // queue runs dry. `avoid` keeps the seam from repeating what is on the belt.
  const draw = useCallback(
    (avoid) => {
      if (!supply.current.length) {
        supply.current = pickRotating(ranked, pass.current++, WINDOW, WINDOW, avoid)
      }
      return supply.current.shift()
    },
    [ranked],
  )

  // Put drinks on the belt until there are `n` of them. Returns whether it
  // actually added any, so a caller knows whether anything needs redrawing.
  const fill = useCallback(
    (n) => {
      const grown = [...seats.current]
      while (grown.length < n) {
        const cocktail = draw(grown.map((s) => s.cocktail.id))
        if (!cocktail) break
        grown.push({ seat: nextSeat.current++, cocktail })
      }
      const added = grown.length > seats.current.length
      seats.current = grown
      return added
    },
    [draw],
  )

  // Build the belt, or pick it up where it was left. Done during the render
  // that first sees a new ranking rather than in an effect, so the strip is
  // never briefly empty — and written only to refs, so it is safe to repeat.
  const key = useMemo(() => ranked.slice(0, WINDOW).map((c) => c.id).join(), [ranked])
  if (built.current !== key) {
    built.current = key
    supply.current = []
    pass.current = 0
    nextSeat.current = 0

    const byId = new Map(ranked.map((c) => [c.id, c]))
    const revived =
      parked.key === key ? parked.ids.map((id) => byId.get(id)).filter(Boolean) : []

    if (revived.length === parked.ids.length && revived.length >= MIN_SEATS) {
      offset.current = parked.offset
      seats.current = revived.map((cocktail) => ({ seat: nextSeat.current++, cocktail }))
    } else {
      offset.current = 0
      seats.current = []
      fill(MIN_SEATS)
    }
    parked.key = key
  }

  // Leave the belt where it stands, for whenever Discover comes back.
  useEffect(
    () => () => {
      parked.offset = offset.current
      parked.ids = seats.current.map((s) => s.cocktail.id)
    },
    [],
  )

  // The first drink walks off the left; a new one joins at the right.
  const advance = useCallback(() => {
    const incoming = draw(seats.current.map((s) => s.cocktail.id))
    if (!incoming) return false
    seats.current = [
      ...seats.current.slice(1),
      { seat: nextSeat.current++, cocktail: incoming },
    ]
    redraw()
    return true
  }, [draw])

  const count = seats.current.length

  // Sets the belt's position, after every render.
  //
  // This is also where a finished tile's travel is taken off the clock, and it
  // has to be here rather than in the frame that asks for the tile to be
  // recycled. Re-cutting the row is a state change, and React commits those
  // after the frame that asked for them: discounting the travel any earlier
  // left one painted frame where the row was still the old one but the belt had
  // already been wound back a tile, so the drink that had just left reappeared
  // at the left edge and everything jumped sideways — a flicker once every
  // eleven seconds. Winding back here instead puts the two in the same paint.
  //
  // It runs before the browser draws, which also means returning to Discover
  // never shows a frame of the belt back at its start.
  useLayoutEffect(() => {
    if (rewind.current) {
      offset.current -= rewind.current
      rewind.current = 0
    }
    if (trackRef.current && !reducedMotion()) {
      trackRef.current.style.transform = `translate3d(${-offset.current}px, 0, 0)`
    }
  })

  useEffect(() => {
    const track = trackRef.current
    if (!track || count < 2) return undefined

    // Measured rather than assumed, so the belt follows whatever width the
    // stylesheet gives a card on this screen.
    const measure = () => {
      const first = track.firstElementChild
      if (!first) return
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0
      stride.current = first.getBoundingClientRect().width + gap
      // A wider screen fits more tiles across, and the belt has to reach past
      // the right edge for the whole of its travel — one tile short and a gap
      // opens there just before the next one is recycled in.
      const across = track.parentElement.getBoundingClientRect().width
      if (fill(Math.ceil(across / stride.current) + 2)) redraw()
    }
    measure()
    window.addEventListener('resize', measure)

    // Somebody who has asked for less movement gets a belt that steps instead
    // of walking: same drinks, same order, no animation.
    if (reducedMotion()) {
      track.style.transform = ''
      const id = setInterval(advance, STEP_MS)
      return () => {
        clearInterval(id)
        window.removeEventListener('resize', measure)
      }
    }

    let raf
    let last = performance.now()
    const frame = (now) => {
      // Clamped, so a spell in the background — where frames stop coming —
      // does not arrive as one long lurch.
      const dt = Math.min(now - last, 120) / 1000
      last = now
      if (!held.current) offset.current += SPEED * dt
      // Ask for the row to be re-cut, but leave the offset alone: it still
      // describes where the row currently on screen belongs. The layout effect
      // winds it back a tile at the same moment the new row lands.
      if (stride.current && !rewind.current && offset.current >= stride.current) {
        if (advance()) rewind.current = stride.current
        else offset.current -= stride.current
      }
      track.style.transform = `translate3d(${-offset.current}px, 0, 0)`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [count, advance, fill])

  if (count < 2) return null

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

      <div className="recs-belt">
        <div
          className="recs-track"
          ref={trackRef}
          // A card is easier to hit when it is standing still.
          onPointerDown={() => {
            held.current = true
          }}
          onPointerUp={() => {
            held.current = false
          }}
          onPointerCancel={() => {
            held.current = false
          }}
          onPointerLeave={() => {
            held.current = false
          }}
        >
          {seats.current.map(({ seat, cocktail }) => {
            // Spirits this drink uses, in recipe order, and which you own.
            const needed = spiritsInIngredientOrder(cocktail)
            const owned = needed.filter((s) => pantry.includes(s))
            // You can make it right now if you have every spirit it needs.
            const ready = needed.length > 0 && owned.length === needed.length
            return (
              <div className="recs-slot" key={seat}>
                <CocktailCard
                  cocktail={cocktail}
                  saved={savedIds.includes(cocktail.id)}
                  spirits={owned}
                  ready={ready}
                />
              </div>
            )
          })}
        </div>
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
