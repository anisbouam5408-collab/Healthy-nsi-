import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import Logo from '../ui/Logo.jsx'
import Icon from '../ui/Icon.jsx'
import { NAV_ITEMS } from './navItems.js'
import { useAuth } from '../../hooks/useAuth.js'

function NavItems({ onNavigate }) {
  const { isOwner } = useAuth()
  const items = NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner)

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="التنقل الرئيسي">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            }`
          }
        >
          <Icon name={item.icon} size={19} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

NavItems.propTypes = { onNavigate: PropTypes.func }

/** Persistent desktop sidebar (≥ md). Rendered separately from the mobile drawer. */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-e border-ink-100 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <NavItems />
      </div>
      <p className="px-5 py-4 text-[11px] text-ink-400">رونق © {new Date().getFullYear()}</p>
    </aside>
  )
}

/** Off-canvas drawer for small screens, opened from the header's menu button. */
export function MobileDrawer({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex md:hidden animate-fade-in">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-72 flex-col bg-white shadow-popover animate-scale-in" role="dialog" aria-modal="true" aria-label="قائمة التنقل">
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavItems onNavigate={onClose} />
        </div>
      </div>
    </div>
  )
}

MobileDrawer.propTypes = { open: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired }
