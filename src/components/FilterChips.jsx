// One filter group as a row of chips. The "All" chip carries the group's name
// on Discover, where the rows have no headings; inside the filter sheet the
// chips wrap so a whole group is visible at once.
export default function FilterChips({ allLabel, options, value, onChange, wrap = false }) {
  return (
    <div className={'chips' + (wrap ? ' chips-wrap' : '')}>
      <button
        className={'chip' + (value === 'All' ? ' active' : '')}
        onClick={() => onChange('All')}
      >
        {allLabel}
      </button>
      {options.map((o) => (
        <button
          key={o}
          className={'chip' + (value === o ? ' active' : '')}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
