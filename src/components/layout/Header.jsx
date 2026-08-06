import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import Icon from '../ui/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { ROLE_LABELS } from '../../lib/roles.js'

export default function Header({ title, onOpenMenu }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const initials = (user?.name || '؟').trim().slice(0, 1)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="فتح القائمة"
        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800 md:hidden"
      >
        <Icon name="menu" size={22} />
      </button>

      <h1 className="flex-1 truncate text-base font-bold text-ink-900 sm:text-lg">{title}</h1>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-xl border border-ink-100 py-1.5 pe-3 ps-1.5 text-start hover:bg-ink-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {initials}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold text-ink-800">{user?.name}</span>
            <span className="text-xs text-ink-400">{ROLE_LABELS[user?.role]}</span>
          </span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute end-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-popover animate-scale-in"
          >
            <div className="px-3.5 py-2 sm:hidden">
              <p className="text-sm font-semibold text-ink-800">{user?.name}</p>
              <p className="text-xs text-ink-400">{ROLE_LABELS[user?.role]}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <Icon name="logout" size={17} />
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  onOpenMenu: PropTypes.func.isRequired,
}
