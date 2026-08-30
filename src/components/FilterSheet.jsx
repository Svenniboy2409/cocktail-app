import { useDismissableSheet } from '../lib/hooks'
import FilterChips from './FilterChips'

// Every filter in one place, including the two that also sit on the Discover
// page — so this sheet always shows the full picture of what is selected.
export default function FilterSheet({ groups, count, hasFilters, onClear, onClose }) {
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
      <div
        className="sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        style={sheetStyle}
      >
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>Filters</h2>
            <button
              className="sheet-close"
              onClick={onClear}
              disabled={!hasFilters}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="sheet-body">
          {groups.map((g) => (
            <div className="field" key={g.label}>
              <label>{g.label}</label>
              <FilterChips
                allLabel="All"
                options={g.options}
                value={g.value}
                onChange={g.onChange}
                wrap
              />
            </div>
          ))}
        </div>

        <div className="sheet-footer">
          <button className="btn btn-primary btn-block" onClick={onClose}>
            Show {count} {count === 1 ? 'cocktail' : 'cocktails'}
          </button>
        </div>
      </div>
    </>
  )
}
