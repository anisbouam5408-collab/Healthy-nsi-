import { useCallback, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { makeId } from '../lib/id.js'
import { ToastContext } from './toast-context.js'

const VARIANT_STYLES = {
  success: { bar: 'bg-emerald-500', icon: '✓', iconBg: 'bg-emerald-50 text-emerald-600' },
  error: { bar: 'bg-rose-600', icon: '!', iconBg: 'bg-rose-50 text-rose-600' },
  info: { bar: 'bg-brand-600', icon: 'i', iconBg: 'bg-brand-50 text-brand-700' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (message, variant = 'success', duration = 3500) => {
      const id = makeId()
      setToasts((prev) => [...prev, { id, message, variant }])
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
      return id
    },
    [dismiss]
  )

  const api = {
    success: (message) => notify(message, 'success'),
    error: (message) => notify(message, 'error'),
    info: (message) => notify(message, 'info'),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-atomic="false"
        role="status"
      >
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant] ?? VARIANT_STYLES.info
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-ink-100 bg-white py-3 pe-3 ps-4 shadow-popover animate-toast-in"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.iconBg}`}
                aria-hidden="true"
              >
                {style.icon}
              </span>
              <p className="flex-1 text-sm text-ink-800">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                aria-label="إغلاق التنبيه"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
