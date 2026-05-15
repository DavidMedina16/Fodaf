import type { ActivityStatus, MemberRole } from '~~/types/database'

/**
 * "Reloj" global que se actualiza cada 30 segundos. Lo usamos para
 * que el `effectiveStatus` cambie en vivo cuando una actividad
 * `scheduled` alcanza su hora de inicio sin necesidad de recargar.
 *
 * Se inicializa una sola vez (la primera vez que se monta un
 * componente que pide permisos) y queda activo durante la sesión.
 */
export function useGlobalClock(): Ref<number> {
  const now = useState<number>('activity-clock-now', () => Date.now())
  const initialized = useState<boolean>('activity-clock-initialized', () => false)

  if (!initialized.value && typeof window !== 'undefined') {
    initialized.value = true
    setInterval(() => {
      now.value = Date.now()
    }, 30_000)
  }

  return now
}

/**
 * Calcula el estado efectivo de una actividad combinando el
 * `status` guardado en BD con `start_at`: una `scheduled` cuya
 * hora ya pasó se trata como `in_progress`. Espejo de la función
 * SQL `effective_activity_status()`.
 */
export function effectiveActivityStatus(
  status: ActivityStatus | null,
  startAt: string | null,
  nowMs: number,
): ActivityStatus | null {
  if (!status) return null
  if (status !== 'scheduled') return status
  if (!startAt) return 'in_progress'
  return Date.parse(startAt) <= nowMs ? 'in_progress' : 'scheduled'
}

/**
 * Permisos sobre una actividad. La regla viene de los estatutos:
 *
 *   - El admin puede ver y modificar cualquier actividad mientras
 *     no esté `finished`. Es el único que puede reabrir una.
 *   - Un miembro del comité asignado puede ver y modificarla
 *     mientras no esté `finished` (incluso si está `scheduled`,
 *     para preparar gastos / inventario antes del evento).
 *   - Cualquier otro miembro solo entra al detalle cuando está
 *     `finished`. Mientras está `scheduled` o `in_progress` la ve
 *     en la lista con su badge pero no entra al detalle.
 */
export interface ActivityPermissionInput {
  currentUserId: Ref<string | null>
  currentUserRole: Ref<MemberRole | null>
  activityStatus: Ref<ActivityStatus | null>
  /** Fecha/hora de inicio. `null` para actividades pre-migración. */
  activityStartAt: Ref<string | null>
  /** IDs de los miembros del comité asignado a la actividad. */
  committeeMemberIds: Ref<string[]>
}

export function useActivityPermissions(input: ActivityPermissionInput) {
  const nowMs = useGlobalClock()

  const isAdmin = computed(() => input.currentUserRole.value === 'admin')

  const isCommitteeMember = computed(() => {
    const id = input.currentUserId.value
    return !!id && input.committeeMemberIds.value.includes(id)
  })

  // Estado efectivo: rebaja `scheduled` a `in_progress` si la hora
  // ya pasó. Espejo de `effective_activity_status()` en SQL.
  const effectiveStatus = computed(() =>
    effectiveActivityStatus(input.activityStatus.value, input.activityStartAt.value, nowMs.value),
  )

  // Acceso al detalle: si está finalizada, todos. Si está
  // `scheduled` o `in_progress`, solo admin o comité.
  const canViewDetail = computed(() => {
    if (effectiveStatus.value === 'finished') return true
    return isAdmin.value || isCommitteeMember.value
  })

  // Edición de gastos / inventario / ventas: cualquier estado
  // distinto de `finished`, y solo admin o comité.
  const canEdit = computed(() => {
    if (effectiveStatus.value === 'finished') return false
    return isAdmin.value || isCommitteeMember.value
  })

  // Finalizar: admin o comité, mientras no esté ya `finished`.
  const canFinalize = computed(() => {
    if (effectiveStatus.value === 'finished') return false
    return isAdmin.value || isCommitteeMember.value
  })

  // Reabrir: solo admin, y solo si está `finished`.
  const canReopen = computed(() => {
    return isAdmin.value && effectiveStatus.value === 'finished'
  })

  return {
    isAdmin,
    isCommitteeMember,
    effectiveStatus,
    canViewDetail,
    canEdit,
    canFinalize,
    canReopen,
  }
}
