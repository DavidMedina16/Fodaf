/**
 * Composable para manejar fechas en zona horaria local (Colombia UTC-5).
 * Los inputs datetime-local y date del navegador trabajan en hora local,
 * pero toISOString() convierte a UTC. Este composable evita ese desfase.
 */
export function useLocalDate() {
  /** Fecha y hora local como string para input datetime-local (YYYY-MM-DDTHH:mm) */
  function toLocalDatetime(date: Date = new Date()): string {
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
  }

  /** Fecha local como string para input date (YYYY-MM-DD) */
  function toLocalDate(date: Date = new Date()): string {
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
  }

  /**
   * Convierte el valor de un input datetime-local/date a ISO con offset Colombia.
   * Supabase acepta el formato y lo almacena correctamente en timestamptz.
   */
  function toISOWithOffset(localValue: string): string {
    const date = new Date(localValue)
    return date.toISOString()
  }

  return { toLocalDate, toLocalDatetime, toISOWithOffset }
}
