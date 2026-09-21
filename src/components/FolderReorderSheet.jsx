import { useMemo, useState, useRef } from 'react'
import { cocktails } from '../data/cocktails'
import { useDismissableSheet, useUserRecipes } from '../lib/hooks'
import { setFolderIds } from '../lib/storage'
import { IconDrag } from './icons'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

// Row height + gap, kept in step with .reorder-row in the stylesheet. The drag
// works in whole rows, so it has to know how tall one is.
const ROW = 62
const GAP = 8
const STEP = ROW + GAP

// Drag a drink up or down to say where it sits in the folder.
//
// Nothing is reordered while you drag: the row under your finger follows it
// and the rows it passes slide one place out of the way, all through
// transforms. The list itself is only rewritten when you let go, by which
// point it already looks exactly like that — so there is no jump.
export default function FolderReorderSheet({ folder, onClose }) {
  const { recipes } = useUserRecipes()
  const { t } = useI18n()
  const showToast = useToast()
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)

  const [order, setOrder] = useState(() => {
    const pool = [...recipes, ...cocktails]
    return folder.ids.map((id) => pool.find((c) => c.id === id)).filter(Boolean)
  })
  const [from, setFrom] = useState(null)
  const [dy, setDy] = useState(0)
  const startY = useRef(0)
  const [busy, setBusy] = useState(false)

  // Where the dragged row would land if you let go now.
  const to = useMemo(() => {
    if (from == null) return null
    const shift = Math.round(dy / STEP)
    return Math.max(0, Math.min(order.length - 1, from + shift))
  }, [from, dy, order.length])

  const down = (e, i) => {
    e.preventDefault()
    startY.current = e.clientY
    setFrom(i)
    setDy(0)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture not supported */
    }
  }

  const move = (e) => {
    if (from == null) return
    setDy(e.clientY - startY.current)
  }

  const up = () => {
    if (from == null) return
    if (to != null && to !== from) {
      setOrder((o) => {
        const next = [...o]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    }
    setFrom(null)
    setDy(0)
  }

  // Where row i currently appears to sit, which during a drag is not where it
  // sits in the array — the numbers down the side count this, not the array.
  const seat = (i) => {
    if (from == null || to == null) return i
    if (i === from) return to
    if (from < to && i > from && i <= to) return i - 1
    if (to < from && i >= to && i < from) return i + 1
    return i
  }

  // How far row i has to shift to make room for the one being dragged.
  const offset = (i) => (from == null || to == null ? 0 : i === from ? dy : (seat(i) - i) * STEP)

  const handleSave = async () => {
    setBusy(true)
    await setFolderIds(folder.id, order.map((c) => c.id))
    showToast(t('Order saved'))
    onClose()
  }

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
      <div
        className="sheet sheet-tall"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Rearrange')}
        style={sheetStyle}
      >
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{t('Rearrange')}</h2>
            <button className="sheet-close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
              {t('Cancel')}
            </button>
          </div>
        </div>

        <div className="sheet-body">
          <p className="muted" style={{ margin: '0 0 14px', fontSize: 14 }}>
            {t('Drag a cocktail to move it. The order here is the order in the folder.')}
          </p>
          <div className="reorder-list" style={{ height: order.length * STEP - GAP }}>
            {order.map((c, i) => (
              <div
                key={c.id}
                className={'reorder-row' + (i === from ? ' dragging' : '')}
                style={{
                  top: i * STEP,
                  transform: `translateY(${offset(i)}px)`,
                  transition: i === from ? 'none' : 'transform 0.18s ease',
                }}
                onPointerDown={(e) => down(e, i)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
              >
                <span className="reorder-num">{seat(i) + 1}</span>
                <img src={c.image} alt="" loading="lazy" />
                <span className="reorder-name">{c.name}</span>
                <IconDrag />
              </div>
            ))}
          </div>
        </div>

        <div className="sheet-footer">
          <button className="btn btn-primary btn-block" onClick={handleSave} disabled={busy}>
            {t('Save order')}
          </button>
        </div>
      </div>
    </>
  )
}
