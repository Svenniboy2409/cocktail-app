import { useDismissableSheet } from '../lib/hooks'
import FilterChips from './FilterChips'
import { useI18n } from '../lib/i18n'

// Every filter in one place, including the two that also sit on the Discover
// page — so this sheet always shows the full picture of what is selected.
export default function FilterSheet({ groups, count, hasFilters, onClear, onClose }) {
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)
  const { t, tt } = useI18n()

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
      <div
        className="sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Filters')}
        style={sheetStyle}
      >
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{t('Filters')}</h2>
            <button
              className="sheet-close"
              onClick={onClear}
              disabled={!hasFilters}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {t('Reset')}
            </button>
          </div>
        </div>

        <div className="sheet-body">
          {groups.map((g) => (
            <div className="field" key={g.label}>
              <label>{t(g.label)}</label>
              <FilterChips
                allLabel={t('All')}
                options={g.options}
                label={tt}
                value={g.value}
                onChange={g.onChange}
                wrap
              />
            </div>
          ))}
        </div>

        <div className="sheet-footer">
          <button className="btn btn-primary btn-block" onClick={onClose}>
            {t(count === 1 ? 'Show {n} cocktail' : 'Show {n} cocktails', { n: count })}
          </button>
        </div>
      </div>
    </>
  )
}
