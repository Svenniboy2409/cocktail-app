// Small inline SVG icons (stroke = currentColor).
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconCompass = (p) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...S} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
  </svg>
)

export const IconLibrary = (p) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...S} {...p}>
    <path d="M4 19V6a1 1 0 0 1 1-1h5v14H5a1 1 0 0 1-1-1Z" />
    <path d="M20 19V6a1 1 0 0 0-1-1h-5v14h5a1 1 0 0 0 1-1Z" />
    <path d="M10 9h4M10 12h4" />
  </svg>
)

export const IconSearch = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...S} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
)

export const IconBookmark = ({ filled, ...p }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...S} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
  </svg>
)

export const IconBack = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...S} {...p}>
    <path d="m14 6-6 6 6 6" />
  </svg>
)

export const IconTrash = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...S} {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
)

export const IconEdit = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...S} {...p}>
    <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L4 18v2Z" />
    <path d="M14 6.5 17.5 10" />
  </svg>
)

export const IconImage = (p) => (
  <svg width="30" height="30" viewBox="0 0 24 24" {...S} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m5 18 5-5 4 3 3-2 4 4" />
  </svg>
)

export const IconDownload = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...S} {...p}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />
  </svg>
)

export const IconUpload = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...S} {...p}>
    <path d="M12 20V9m0 0 4 4m-4-4-4 4M5 4h14" />
  </svg>
)

export const IconGlass = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...S} {...p}>
    <path d="M5 4h14l-7 8zM12 12v6M8 18h8" />
  </svg>
)

export const IconGarnish = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...S} {...p}>
    <circle cx="12" cy="13" r="6" />
    <path d="M12 7c0-2 1-3 3-3" />
  </svg>
)
