// How tall the window really is, and whether the page is zoomed — both kept in
// the document element for the stylesheet to use.
//
// The shell is sized to the viewport, and browsers are supposed to report that
// correctly. Two of them do not:
//
//  - Safari hands back a stale height for the first moments after load, which
//    leaves a strip of page showing below the bottom bar until something forces
//    a fresh measurement. Opening the keyboard is one such thing, which is why
//    the strip used to disappear the first time you typed. So measure it here,
//    and again whenever the window changes.
//
//  - Launched from the home screen, iOS reports a height that leaves out the
//    inset around the home indicator, even though the app is drawn right to the
//    bottom of the screen. Nothing forces that to be corrected, which is why the
//    strip came back for a web app that had been added to the home screen. There
//    the screen's own height is the honest answer, and it is only ever taken
//    when it is a little taller than what the window claims.
//
// `window.innerHeight` is the source everywhere else: unlike the visual
// viewport it does not shrink when the keyboard appears, so the bar stays where
// it belongs instead of riding up. Measurements taken while somebody is typing
// are skipped anyway, for the browsers that do resize then.

// The largest inset iOS puts around the home indicator and the status bar
// together. A correction bigger than this is not an inset, it is a wrong guess,
// and is left alone.
const MAX_INSET = 200

function typing() {
  const el = document.activeElement
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

// Launched from the home screen rather than opened in the browser.
function standalone() {
  if (window.navigator.standalone === true) return true
  try {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches
  } catch {
    return false
  }
}

// What the browser itself thinks a box pinned to the top and bottom edges
// comes out as. That is a second opinion, arrived at by a different route from
// `window.innerHeight`, and it catches the case where the window under-reports
// but the layout is drawn to the full height anyway.
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

function measure() {
  let h = window.innerHeight || 0
  const client = document.documentElement.clientHeight || 0
  if (client > h) h = client
  // On the home screen the app owns the whole screen, so anything the window
  // leaves off the bottom is an inset it forgot about. Two other answers are
  // taken there, and only when each is a little taller than what the window
  // claims — a much bigger difference is not an inset but a wrong guess.
  if (standalone()) {
    for (const other of [probeHeight(), window.screen?.height || 0]) {
      if (other > h && other - h <= MAX_INSET) h = other
    }
  }
  // Round up, never down: overshooting hides a sub-pixel sliver of the bar's
  // own border, coming up short shows a sliver of the page below it.
  return Math.ceil(h)
}

export function trackViewportHeight() {
  const vv = window.visualViewport

  const apply = () => {
    if (typing()) return
    const h = measure()
    if (h > 0) document.documentElement.style.setProperty('--app-h', `${h}px`)
  }

  // Pinching zooms the visual viewport in over a layout that does not move with
  // it, so anything pinned to an edge ends up floating somewhere across the
  // middle of what you are looking at. Take the bar away until you zoom back.
  const checkZoom = () => {
    const zoomed = !!vv && vv.scale > 1.02
    document.documentElement.classList.toggle('is-zoomed', zoomed)
  }

  const both = () => {
    apply()
    checkZoom()
  }

  both()
  window.addEventListener('resize', both)
  window.addEventListener('load', both)
  window.addEventListener('pageshow', both)
  window.addEventListener('orientationchange', () => setTimeout(both, 120))
  vv?.addEventListener('resize', both)
  vv?.addEventListener('scroll', checkZoom)
  // Measurements are skipped while somebody types, so take one when they stop.
  window.addEventListener('focusout', () => setTimeout(apply, 60))
  // The startup case: a few re-reads while the browser settles its chrome.
  for (const ms of [60, 300, 1000]) setTimeout(both, ms)
}
