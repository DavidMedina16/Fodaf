/**
 * Utilidades globales de formateo (auto-importadas por Nuxt 4).
 * Centralizan COP y fechas en hora local de Colombia para evitar
 * duplicación entre páginas y desfases por UTC.
 */

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

/**
 * Formatea fechas en hora local Colombia.
 * Acepta tanto `YYYY-MM-DD` (columnas DATE) como ISO timestamps con
 * zona horaria (columnas timestamptz).
 */
export function formatDate(dateStr: string): string {
  const date = dateStr.length === 10
    ? new Date(dateStr + 'T12:00:00')
    : new Date(dateStr)

  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formatea fecha + hora en hora local Colombia. Para timestamptz
 * (ej. `start_at` de actividades). Devuelve algo como
 * "18 mayo de 2026, 03:00 p. m.".
 */
export function formatDatetime(isoStr: string): string {
  return new Date(isoStr).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
