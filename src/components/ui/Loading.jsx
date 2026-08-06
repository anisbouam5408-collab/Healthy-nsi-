import PropTypes from 'prop-types'

export function Spinner({ className = 'h-5 w-5', label = 'جارِ التحميل' }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <svg className={`animate-spin text-brand-600 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}

Spinner.propTypes = { className: PropTypes.string, label: PropTypes.string }

export function FullPageLoading({ label = 'جارِ تحميل رونق…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  )
}

FullPageLoading.propTypes = { label: PropTypes.string }

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="animate-pulse divide-y divide-ink-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((__, c) => (
              <div key={c} className="h-4 flex-1 rounded bg-ink-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

TableSkeleton.propTypes = { rows: PropTypes.number, cols: PropTypes.number }
