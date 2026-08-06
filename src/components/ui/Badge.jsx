import PropTypes from 'prop-types'

const TONES = {
  neutral: 'bg-ink-100 text-ink-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  brand: 'bg-brand-50 text-brand-700',
}

export default function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  )
}

Badge.propTypes = {
  tone: PropTypes.oneOf(Object.keys(TONES)),
  children: PropTypes.node,
}
