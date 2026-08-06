import PropTypes from 'prop-types'

/** Inline SVG mark + wordmark, no external assets or icon fonts. */
export default function Logo({ withWordmark = true, size = 32, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Rawnaq"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="rawnaq-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e34d85" />
            <stop offset="100%" stopColor="#a92053" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#rawnaq-mark)" />
        <path
          d="M32 10 L37 27 L54 32 L37 37 L32 54 L27 37 L10 32 L27 27 Z"
          fill="#fff"
        />
        <circle cx="47" cy="15" r="3.2" fill="#e8c477" />
      </svg>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold text-ink-900">رونق</span>
          <span className="text-[10px] font-medium tracking-wide text-ink-400">RAWNAQ</span>
        </span>
      )}
    </span>
  )
}

Logo.propTypes = {
  withWordmark: PropTypes.bool,
  size: PropTypes.number,
  className: PropTypes.string,
}
