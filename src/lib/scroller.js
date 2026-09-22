// The app is a fixed shell with one scrolling element inside it, rather than a
// document that scrolls. That is what keeps the bottom bar and the sheets
// welded to the bottom edge: a `position: fixed` element is pinned to the
// viewport, which on a phone moves under you — the address bar collapses as
// you scroll, the keyboard resizes it as you type — and the bar goes drifting
// off the edge. Nothing here scrolls the viewport, so nothing can drift.
//
// Everything that needs to scroll the page programmatically asks for the
// element through this, so they all agree on which one it is.

export function getScroller() {
  return document.getElementById('app-scroll')
}
