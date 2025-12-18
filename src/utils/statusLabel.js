export function statusLabel(s) {
  if (!s) return '—'
  const v = String(s).toLowerCase()
  if (v === 'draft') return 'oferta'
  if (v === 'paid') return 'factura'
  if (v === 'cancelled') return 'cancelada'
  return s
}

export function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'draft') return 'status draft'
  if (v === 'paid') return 'status paid'
  if (v === 'cancelled') return 'status cancelled'
  return 'status'
}

