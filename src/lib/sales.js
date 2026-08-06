/** Rounds money to the nearest whole dinar so totals never drift. */
function round(n) {
  return Math.round(n)
}

/**
 * items: [{ price, quantity }]
 * discount: { type: 'percent' | 'fixed', value: number }
 * Discount is clamped so the total can never go negative or exceed the subtotal.
 */
export function computeSaleTotals(items, discount) {
  const subtotal = round(items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  let discountAmount = 0
  if (discount?.type === 'percent') {
    const pct = Math.min(100, Math.max(0, Number(discount.value) || 0))
    discountAmount = round((subtotal * pct) / 100)
  } else if (discount?.type === 'fixed') {
    discountAmount = round(Math.max(0, Number(discount.value) || 0))
  }
  discountAmount = Math.min(discountAmount, subtotal)
  const total = subtotal - discountAmount
  return { subtotal, discountAmount, total }
}
