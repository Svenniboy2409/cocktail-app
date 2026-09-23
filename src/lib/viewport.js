// A floor for the shell's height, kept in a CSS variable.
//
// The shell fills the viewport in ordinary flow, which is how it covers the
// screen to the last pixel on a phone — including the strip around the home
// indicator that `window.innerHeight` leaves out for an app launched from the
// home screen. So the stylesheet decides the height, and this only ever raises
// it: `max(100%, var(--app-h))`. That way a browser whose own answer comes up
// short gets corrected, and one whose answer is right is left alone.
//
// Safari is the one that needs correcting. It reports a stale height for the
// first moments after load, which used to leave a strip of page showing below
// the bottom bar until something forced a fresh measurement — opening the
// keyboard being the usual culprit, which is why typing appeared to fix it.
//
// `window.innerHeight` is the source, because unlike the visual viewport it
// does not shrink when the keyboard appears, so the bar stays where it belongs
// instead of riding up. Measurements taken while somebody types are skipped
// anyway, for the browsers that do resize then.

function typing() {
  const el = document.activeElement
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

// What the browser itself makes of a box pinned to the top and bottom edges:
// a second opinion on the same question, reached by a different route. It can
// never come out taller than the viewport, so it is safe to take the larger of
// the two.
let probe = null
function probeHeight() {
  if (!probe) {
    probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;top:0;bottom:0;left:0;width:0;visibility:hidden;pointer-events:none'
    document.documentElement.appendChild(probe)
  }
  return probe.getBoundingClientRect().height
}

// Launched from the home screen rather than opened in a browser tab. There the
// app owns the whole screen, so the screen's own height is a fair answer — and
// the one iOS gets right when the others come up an inset short.
function standalone() {
  if (window.navigator.standalone === true) return true
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches
    )
  } catch {
    return false
  }
}

export function trackViewportHeight() {
  const apply = () => {
    if (typing()) return
    let h = Math.max(
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0,
      probeHeight(),
    )
    // Only from the home screen, and only by about an inset: a bigger gap than
    // that is not an inset but a wrong answer, and is left alone. In a browser
    // tab the screen is taller than the page by the whole of the chrome, which
    // would put the bar behind the toolbar.
    if (standalone()) {
      const screenH = window.screen?.height || 0
      if (screenH > h && screenH - h <= 200) h = screenH
    }
    h = Math.ceil(h)
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
