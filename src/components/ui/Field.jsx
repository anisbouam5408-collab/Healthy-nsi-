import { forwardRef } from 'react'
import PropTypes from 'prop-types'

// `w-full` here always wins over a `w-*` passed via `className` (Tailwind's
// generated stylesheet orders width utilities so `w-full` comes last). To
// constrain the width of an Input/Select/Textarea, wrap it in a sized
// container instead of passing a width utility directly to the component.
const baseInputClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus-visible:outline-none disabled:bg-ink-50 disabled:text-ink-400'

export const Input = forwardRef(function Input({ className = '', invalid, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`${baseInputClass} ${invalid ? 'border-rose-400 focus:border-rose-500' : ''} ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
})

Input.propTypes = { className: PropTypes.string, invalid: PropTypes.bool }

export const Select = forwardRef(function Select({ className = '', children, ...rest }, ref) {
  return (
    <select ref={ref} className={`${baseInputClass} ${className}`} {...rest}>
      {children}
    </select>
  )
})

Select.propTypes = { className: PropTypes.string, children: PropTypes.node }

export const Textarea = forwardRef(function Textarea({ className = '', ...rest }, ref) {
  return <textarea ref={ref} className={`${baseInputClass} resize-none ${className}`} {...rest} />
})

Textarea.propTypes = { className: PropTypes.string }

export function Label({ children, htmlFor, required }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-700">
      {children}
      {required && (
        <span className="text-brand-600" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  )
}

Label.propTypes = {
  children: PropTypes.node,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
}

export function FieldError({ children }) {
  if (!children) return null
  return (
    <p className="mt-1 text-xs text-rose-600" role="alert">
      {children}
    </p>
  )
}

FieldError.propTypes = { children: PropTypes.node }
