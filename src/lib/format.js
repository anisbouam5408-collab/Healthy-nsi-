/**
 * Prices are stored as whole Algerian dinars (no centimes), matching how
 * retail cosmetics shops in Algeria actually price stock. All money math
 * rounds to the nearest dinar so totals never drift from floating point.
 */
export function formatMoney(value) {
  const n = Math.round(Number(value) || 0)
  return `${n.toLocaleString('ar-DZ')} د.ج`
}

export function formatDate(isoString) {
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(isoString) {
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('ar-DZ')
}
