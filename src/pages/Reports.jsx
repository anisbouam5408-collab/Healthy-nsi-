import { useMemo, useState } from 'react'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Input, Label } from '../components/ui/Field.jsx'
import { useStore } from '../hooks/useStore.js'
import { useToast } from '../hooks/useToast.js'
import { formatMoney, formatDateTime, formatDate } from '../lib/format.js'
import { downloadCsv } from '../lib/csv.js'

function toDateInputValue(d) {
  return d.toISOString().slice(0, 10)
}

function startOfRange() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d
}

export default function Reports() {
  const { sales, products } = useStore()
  const toast = useToast()

  const [from, setFrom] = useState(toDateInputValue(startOfRange()))
  const [to, setTo] = useState(toDateInputValue(new Date()))

  const filteredSales = useMemo(() => {
    const fromTime = from ? new Date(from + 'T00:00:00').getTime() : -Infinity
    const toTime = to ? new Date(to + 'T23:59:59').getTime() : Infinity
    return sales.filter((s) => {
      const t = new Date(s.date).getTime()
      return t >= fromTime && t <= toTime
    })
  }, [sales, from, to])

  const summary = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
    const discounts = filteredSales.reduce((sum, s) => sum + s.discountAmount, 0)
    const itemsSold = filteredSales.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.quantity, 0), 0)

    const bestSellers = new Map()
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const entry = bestSellers.get(item.productId) ?? { name: item.name, quantity: 0, revenue: 0 }
        entry.quantity += item.quantity
        entry.revenue += item.price * item.quantity
        bestSellers.set(item.productId, entry)
      }
    }
    const topProducts = [...bestSellers.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)

    return { revenue, discounts, itemsSold, count: filteredSales.length, topProducts }
  }, [filteredSales])

  const inventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0),
    [products]
  )

  const handleExportSales = () => {
    downloadCsv(
      `تقرير_المبيعات_${from}_${to}.csv`,
      [
        { key: 'date', label: 'التاريخ' },
        { key: 'itemsCount', label: 'عدد الأصناف' },
        { key: 'subtotal', label: 'المجموع الفرعي' },
        { key: 'discountAmount', label: 'التخفيض' },
        { key: 'total', label: 'المجموع' },
        { key: 'paymentMethod', label: 'طريقة الدفع' },
        { key: 'cashier', label: 'البائع' },
      ],
      filteredSales.map((s) => ({
        date: formatDateTime(s.date),
        itemsCount: s.items.reduce((n, i) => n + i.quantity, 0),
        subtotal: s.subtotal,
        discountAmount: s.discountAmount,
        total: s.total,
        paymentMethod: s.paymentMethod === 'cash' ? 'نقدًا' : 'بطاقة',
        cashier: s.cashier,
      }))
    )
    toast.success('تم تصدير تقرير المبيعات بصيغة CSV')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
        <div>
          <Label htmlFor="rep-from">من تاريخ</Label>
          <Input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to} />
        </div>
        <div>
          <Label htmlFor="rep-to">إلى تاريخ</Label>
          <Input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from} />
        </div>
        <Button variant="secondary" className="ms-auto" onClick={handleExportSales} disabled={filteredSales.length === 0}>
          <Icon name="download" size={17} />
          تصدير CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <p className="text-xs font-medium text-ink-500">إجمالي الإيرادات</p>
          <p className="mt-1 text-xl font-bold text-ink-900">{formatMoney(summary.revenue)}</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <p className="text-xs font-medium text-ink-500">عدد عمليات البيع</p>
          <p className="mt-1 text-xl font-bold text-ink-900">{summary.count}</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <p className="text-xs font-medium text-ink-500">إجمالي التخفيضات</p>
          <p className="mt-1 text-xl font-bold text-ink-900">{formatMoney(summary.discounts)}</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <p className="text-xs font-medium text-ink-500">قيمة المخزون الحالي (تكلفة)</p>
          <p className="mt-1 text-xl font-bold text-ink-900">{formatMoney(inventoryValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h3 className="mb-3 text-sm font-bold text-ink-900">الأكثر مبيعًا</h3>
          {summary.topProducts.length === 0 ? (
            <EmptyState icon={<Icon name="reports" size={22} />} title="لا توجد بيانات" description="لا توجد مبيعات في هذه الفترة" />
          ) : (
            <ul className="divide-y divide-ink-100">
              {summary.topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between py-3 text-sm">
                  <p className="truncate font-medium text-ink-800">{p.name}</p>
                  <div className="flex shrink-0 items-center gap-4 text-ink-500">
                    <span>{p.quantity} قطعة</span>
                    <span className="font-semibold text-ink-800">{formatMoney(p.revenue)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h3 className="mb-3 text-sm font-bold text-ink-900">آخر عمليات البيع بالفترة</h3>
          {filteredSales.length === 0 ? (
            <EmptyState icon={<Icon name="cart" size={22} />} title="لا توجد مبيعات" description="لم تسجَّل أي عملية بيع في هذه الفترة" />
          ) : (
            <ul className="max-h-72 divide-y divide-ink-100 overflow-y-auto">
              {filteredSales.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-800">{formatDate(s.date)}</p>
                    <p className="text-xs text-ink-400">{s.cashier}</p>
                  </div>
                  <span className="font-bold text-ink-900">{formatMoney(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
