import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import Icon from '../components/ui/Icon.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useStore } from '../hooks/useStore.js'
import { useAuth } from '../hooks/useAuth.js'
import { formatMoney, formatDateTime } from '../lib/format.js'

function isToday(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function StatCard({ icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    gold: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    ink: 'bg-ink-100 text-ink-700',
  }
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-0.5 truncate text-xl font-bold text-ink-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['brand', 'gold', 'danger', 'ink']),
}

export default function Dashboard() {
  const { products, customers, sales } = useStore()
  const { user } = useAuth()

  const stats = useMemo(() => {
    const todaySales = sales.filter((s) => isToday(s.date))
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
    const lowStock = products.filter((p) => p.quantity <= p.minQuantity)
    return {
      todayCount: todaySales.length,
      todayRevenue,
      lowStock,
      productCount: products.length,
      customerCount: customers.length,
    }
  }, [sales, products, customers])

  const recentSales = sales.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink-900">مرحبًا، {user?.name} 👋</h2>
        <p className="mt-0.5 text-sm text-ink-500">هذا ملخص نشاط محلك اليوم</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="money" label="مبيعات اليوم" value={formatMoney(stats.todayRevenue)} tone="brand" />
        <StatCard icon="cart" label="عدد عمليات البيع اليوم" value={stats.todayCount} tone="gold" />
        <StatCard icon="box" label="عدد المنتجات" value={stats.productCount} tone="ink" />
        <StatCard icon="alert" label="منتجات ناقصة المخزون" value={stats.lowStock.length} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">آخر عمليات البيع</h3>
            <Link to="/pos" className="text-xs font-semibold text-brand-700 hover:underline">
              بيع جديد
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <EmptyState
              icon={<Icon name="cart" size={22} />}
              title="لا توجد مبيعات بعد"
              description="أول عملية بيع رح تظهر هنا"
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-800">
                      {sale.items.length} منتج · {sale.cashier}
                    </p>
                    <p className="text-xs text-ink-400">{formatDateTime(sale.date)}</p>
                  </div>
                  <span className="shrink-0 font-bold text-ink-900">{formatMoney(sale.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">تنبيهات المخزون</h3>
            <Link to="/inventory" className="text-xs font-semibold text-brand-700 hover:underline">
              إدارة المخزون
            </Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <EmptyState
              icon={<Icon name="box" size={22} />}
              title="المخزون في وضع جيد"
              description="ماكاش منتجات وصلت للحد الأدنى"
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {stats.lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <p className="truncate font-medium text-ink-800">{p.name}</p>
                  <Badge tone={p.quantity === 0 ? 'danger' : 'warning'}>
                    {p.quantity === 0 ? 'نفدت الكمية' : `متبقي ${p.quantity}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
