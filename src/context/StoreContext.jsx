import PropTypes from 'prop-types'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { makeId } from '../lib/id.js'
import { computeSaleTotals } from '../lib/sales.js'
import { seedProducts, seedCustomers } from '../data/seed.js'
import { StoreContext } from './store-context.js'

export function StoreProvider({ children }) {
  const [products, setProducts] = useLocalStorage('products', seedProducts)
  const [customers, setCustomers] = useLocalStorage('customers', seedCustomers)
  const [sales, setSales] = useLocalStorage('sales', [])

  const addProduct = (data) => {
    const product = {
      id: makeId(),
      name: data.name.trim(),
      category: data.category,
      costPrice: Math.max(0, Math.round(Number(data.costPrice) || 0)),
      price: Math.max(0, Math.round(Number(data.price) || 0)),
      quantity: Math.max(0, Math.round(Number(data.quantity) || 0)),
      minQuantity: Math.max(0, Math.round(Number(data.minQuantity) || 0)),
      sku: data.sku?.trim() || '',
    }
    setProducts((prev) => [product, ...prev])
    return product
  }

  const updateProduct = (id, data) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              name: data.name.trim(),
              category: data.category,
              costPrice: Math.max(0, Math.round(Number(data.costPrice) || 0)),
              price: Math.max(0, Math.round(Number(data.price) || 0)),
              quantity: Math.max(0, Math.round(Number(data.quantity) || 0)),
              minQuantity: Math.max(0, Math.round(Number(data.minQuantity) || 0)),
              sku: data.sku?.trim() || '',
            }
          : p
      )
    )
  }

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const addCustomer = (data) => {
    const customer = {
      id: makeId(),
      name: data.name.trim(),
      phone: data.phone?.trim() || '',
      notes: data.notes?.trim() || '',
      totalSpent: 0,
      visits: 0,
    }
    setCustomers((prev) => [customer, ...prev])
    return customer
  }

  const updateCustomer = (id, data) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, name: data.name.trim(), phone: data.phone?.trim() || '', notes: data.notes?.trim() || '' }
          : c
      )
    )
  }

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  /**
   * items: [{ productId, name, price, quantity }]
   * Returns { ok: true, sale } or { ok: false, reason }.
   * Stock is re-validated here (not just in the cart UI) so a sale can
   * never push any product's quantity below zero.
   */
  const completeSale = ({ items, discount, customerId, cashier, paymentMethod }) => {
    if (!items.length) return { ok: false, reason: 'السلة فارغة' }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return { ok: false, reason: `المنتج غير موجود: ${item.name}` }
      if (item.quantity > product.quantity) {
        return { ok: false, reason: `الكمية المطلوبة من "${product.name}" غير متوفرة بالمخزون` }
      }
    }

    const { subtotal, discountAmount, total } = computeSaleTotals(items, discount)

    setProducts((prev) =>
      prev.map((p) => {
        const item = items.find((i) => i.productId === p.id)
        return item ? { ...p, quantity: p.quantity - item.quantity } : p
      })
    )

    const sale = {
      id: makeId(),
      date: new Date().toISOString(),
      items,
      subtotal,
      discount: discount ?? { type: 'fixed', value: 0 },
      discountAmount,
      total,
      customerId: customerId ?? null,
      cashier: cashier ?? 'غير معروف',
      paymentMethod: paymentMethod ?? 'cash',
    }
    setSales((prev) => [sale, ...prev])

    if (customerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, totalSpent: c.totalSpent + total, visits: c.visits + 1 } : c
        )
      )
    }

    return { ok: true, sale }
  }

  const value = {
    products,
    customers,
    sales,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    completeSale,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
