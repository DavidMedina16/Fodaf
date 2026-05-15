import type { FundSettings } from '~~/types/database'

/**
 * Acceso a los parámetros configurables del fondo (`fund_settings`),
 * con histórico por año.
 *
 * - `useFundSettings()` → parámetros del año en curso.
 * - `useFundSettings(2025)` → parámetros del año 2025 (útil para
 *   recalcular liquidaciones pasadas con sus valores originales).
 *
 * Si el año solicitado aún no tiene configuración propia, cae al
 * año configurado más reciente que sea anterior o igual al pedido.
 *
 * El resultado se cachea por año en estado global, por lo que
 * varios componentes que pidan el mismo año comparten una sola
 * consulta. La carga se dispara automáticamente en el primer uso.
 */
export function useFundSettings(year?: number) {
  const targetYear = year ?? new Date().getFullYear()
  const supabase = useSupabase()

  const settings = useState<FundSettings | null>(
    `fund-settings-${targetYear}`,
    () => null,
  )
  const loading = useState<boolean>(
    `fund-settings-loading-${targetYear}`,
    () => false,
  )
  const error = useState<string | null>(
    `fund-settings-error-${targetYear}`,
    () => null,
  )

  /**
   * Carga los parámetros del año objetivo. Usa la caché salvo que
   * `force` sea true (p. ej. tras guardar cambios en el panel).
   */
  async function load(force = false): Promise<FundSettings | null> {
    if (settings.value && !force) return settings.value

    loading.value = true
    error.value = null

    const { data, error: dbError } = await supabase
      .from('fund_settings')
      .select('*')
      .lte('year', targetYear)
      .order('year', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (dbError) {
      error.value = dbError.message
    }
    else {
      settings.value = (data as FundSettings | null)
      if (!settings.value) {
        error.value = `No hay parámetros configurados para el año ${targetYear}.`
      }
    }

    loading.value = false
    return settings.value
  }

  // Dispara la carga la primera vez que se usa este año.
  if (!settings.value && !loading.value) {
    load()
  }

  return {
    /** Parámetros del año objetivo (reactivo, `null` mientras carga). */
    settings,
    /** `true` mientras hay una consulta en curso. */
    loading,
    /** Mensaje de error si la carga falló, `null` si todo va bien. */
    error,
    /** Carga manual (respeta la caché). */
    load,
    /** Fuerza una recarga desde la base de datos. */
    refresh: () => load(true),
  }
}
