import { useMemo, useState } from 'react'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Input, Select, Label } from '../components/ui/Field.jsx'
import { useStore } from '../hooks/useStore.js'
import { computeSaleTotals } from '../lib/sales.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { formatMoney } from '../lib/format.js'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدًا' },
  { value: 'card', label: 'بطاقة' },
]

export default function POS() {
  const { products, customers, completeSale } = useStore()
  const { user } = useAuth()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([]) // [{ productId, name, price, quantity, stock }]
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [submitting, setSubmitting] = useState(false)

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products.slice(0, 20)
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 20)
  }, [products, query])

  const inCartQuantity = (productId) => cart.find((i) => i.productId === productId)?.quantity ?? 0

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error(`"${product.name}" غير متوفر بالمخزون`)
      return
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error(`الكمية المتوفرة من "${product.name}" هي ${product.quantity} فقط`)
          return prev
        }
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.quantity }]
    })
  }

  const changeQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item
          const next = item.quantity + delta
          if (next > item.stock) {
            toast.error(`الكمية المتوفرة من "${item.name}" هي ${item.stock} فقط`)
            return item
          }
          return { ...item, quantity: next }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const removeItem = (productId) => setCart((prev) => prev.filter((i) => i.productId !== productId))

  const discount = useMemo(
    () => ({ type: discountType, value: Number(discountValue) || 0 }),
    [discountType, discountValue]
  )
  const totals = useMemo(() => computeSaleTotals(cart, discount), [cart, discount])

  const clearSale = () => {
    setCart([])
    setDiscountValue('')
    setCustomerId('')
    setPaymentMethod('cash')
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    setSubmitting(true)
    const result = completeSale({
      items: cart.map(({ productId, name, price, quantity }) => ({ productId, name, price, quantity })),
      discount,
      customerId: customerId || null,
      cashier: user?.name,
      paymentMethod,
    })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    toast.success(`تمت عملية البيع بنجاح — ${formatMoney(result.sale.total)}`)
    clearSale()
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <div className="relative">
          <Icon name="search" size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن منتج بالاسم أو المرجع…"
            className="ps-9"
            aria-label="بحث عن منتج"
            autoFocus
          />
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState icon={<Icon name="search" size={22} />} title="ماكاش نتائج" description="جرّب كلمة بحث أخرى" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => {
              const remaining = p.quantity - inCartQuantity(p.id)
              const disabled = remaining <= 0
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={disabled}
                  className="flex flex-col items-start gap-1.5 rounded-2xl border border-ink-100 bg-white p-3.5 text-start shadow-card transition hover:border-brand-300 hover:shadow-popover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-ink-100 disabled:hover:shadow-card"
                >
                  <span className="line-clamp-2 text-sm font-semibold text-ink-800">{p.name}</span>
                  <span className="text-sm font-bold text-brand-700">{formatMoney(p.price)}</span>
                  <span className="text-xs text-ink-400">
                    {disabled ? 'غير متوفر' : `متبقي ${remaining}`}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <aside className="flex flex-col rounded-2xl border border-ink-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Icon name="cart" size={18} />
            السلة ({cart.length})
          </h2>
          {cart.length > 0 && (
            <button type="button" onClick={clearSale} className="text-xs font-medium text-ink-400 hover:text-rose-600">
              إفراغ السلة
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 px-4 py-10">
            <EmptyState icon={<Icon name="cart" size={22} />} title="السلة فارغة" description="اختر منتجات من القائمة لبدء عملية بيع" />
          </div>
        ) : (
          <ul className="max-h-72 flex-1 divide-y divide-ink-100 overflow-y-auto px-4">
            {cart.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">{item.name}</p>
                  <p className="text-xs text-ink-400">{formatMoney(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.productId, -1)}
                    aria-label={`إنقاص كمية ${item.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-ink-800">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.productId, 1)}
                    aria-label={`زيادة كمية ${item.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`إزالة ${item.name} من السلة`}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Icon name="trash" size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 border-t border-ink-100 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pos-customer">الزبون (اختياري)</Label>
              <Select id="pos-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">بدون زبون</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="pos-payment">طريقة الدفع</Label>
              <Select id="pos-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="pos-discount">التخفيض</Label>
            <div className="flex gap-2">
              <div className="w-28 shrink-0">
                <Select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  aria-label="نوع التخفيض"
                >
                  <option value="fixed">دج</option>
                  <option value="percent">%</option>
                </Select>
              </div>
              <Input
                id="pos-discount"
                type="number"
                min="0"
                inputMode="numeric"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className="min-w-0 flex-1"
              />
            </div>
          </div>

          <dl className="space-y-1.5 border-t border-ink-100 pt-3 text-sm">
            <div className="flex justify-between text-ink-500">
              <dt>المجموع الفرعي</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-500">
              <dt>التخفيض</dt>
              <dd>−{formatMoney(totals.discountAmount)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-ink-900">
              <dt>المجموع</dt>
              <dd>{formatMoney(totals.total)}</dd>
            </div>
          </dl>

          <Button className="w-full" size="lg" disabled={cart.length === 0} loading={submitting} onClick={handleCheckout}>
            إتمام البيع
          </Button>
        </div>
      </aside>
    </div>
  )
}
