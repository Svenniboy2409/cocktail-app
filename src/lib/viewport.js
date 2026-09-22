// The true height of the window, kept in a CSS variable.
//
// The shell is sized to the viewport, and browsers are supposed to report that
// correctly — but Safari hands back a stale height for the first moments after
// load, which leaves a strip of page showing below the bottom bar until
// something forces a fresh measurement. Opening the keyboard is one such thing,
// which is why the strip disappears the first time you type. So rather than
// wait for that, measure it ourselves, and again whenever the window changes.
//
// `window.innerHeight` is the right source: unlike the visual viewport it does
// not shrink when the keyboard appears, so the bar stays where it belongs
// instead of riding up. Measurements taken while somebody is typing are
// ignored anyway, for the browsers that do resize then.

function typing() {
  const el = document.activeElement
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

export function trackViewportHeight() {
  const apply = () => {
    if (typing()) return
    // Round up, never down: overshooting hides a sub-pixel sliver of the bar's
    // border, coming up short shows a sliver of the page below it.
    const h = Math.ceil(window.innerHeight)
    if (h > 0) document.documentElement.style.setProperty('--app-h', `${h}px`)
  }

  apply()
  window.addEventListener('resize', apply)
  window.addEventListener('load', apply)
  window.addEventListener('pageshow', apply)
  window.addEventListener('orientationchange', () => setTimeout(apply, 120))
  window.visualViewport?.addEventListener('resize', apply)
  // Measurements are skipped while somebody types, so take one when they stop.
  window.addEventListener('focusout', () => setTimeout(apply, 60))
  // The startup case: a few re-reads while the browser settles its chrome.
  for (const ms of [60, 300, 1000]) setTimeout(apply, ms)
}
