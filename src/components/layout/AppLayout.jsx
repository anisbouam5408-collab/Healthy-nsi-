import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar, MobileDrawer } from './Sidebar.jsx'
import Header from './Header.jsx'
import { FullPageLoading } from '../ui/Loading.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { NAV_ITEMS } from './navItems.js'

const TITLES = {
  '/': 'لوحة التحكم',
  '/pos': 'نقطة البيع',
  '/inventory': 'المخزون',
  '/customers': 'الزبائن',
  '/reports': 'التقارير',
}

/** Shared shell for authenticated pages: sidebar + header + guarded outlet. */
export default function AppLayout() {
  const { user, loading, isOwner } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  const navItem = NAV_ITEMS.find((item) => item.to === location.pathname)
  if (navItem?.ownerOnly && !isOwner) return <Navigate to="/" replace />

  const title = TITLES[location.pathname] ?? 'نكام كوسميتيك'

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} onOpenMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
