<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const supabase = useSupabase()

type TransactionType = 'ingreso' | 'egreso'
type PenaltyReason = 'absence' | 'late_arrival' | 'other'

interface Transaction {
  id: string
  date: string
  sortKey: number
  type: TransactionType
  description: string
  amount: number
}

const transactions = ref<Transaction[]>([])
const loading = ref(true)

const penaltyDescriptions: Record<PenaltyReason, string> = {
  absence: 'Multa por inasistencia',
  late_arrival: 'Multa por llegada tarde',
  other: 'Multa',
}

function toSortKey(dateStr: string): number {
  const normalized = dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr
  return new Date(normalized).getTime()
}

async function loadTransactions() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const [contribResult, withdrawResult, penaltyResult] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, amount, deposit_date')
      .eq('profile_id', user.id)
      .eq('status', 'approved'),
    supabase
      .from('withdrawals')
      .select('id, amount, created_at')
      .eq('profile_id', user.id)
      .eq('status', 'approved'),
    supabase
      .from('penalties')
      .select('id, amount, reason, created_at')
      .eq('profile_id', user.id)
      .eq('status', 'deducted_from_savings'),
  ])

  const contribs: Transaction[] = (contribResult.data ?? []).map(c => ({
    id: `contrib-${c.id}`,
    date: c.deposit_date,
    sortKey: toSortKey(c.deposit_date),
    type: 'ingreso',
    description: 'Aporte mensual',
    amount: c.amount,
  }))

  const withdrawals: Transaction[] = (withdrawResult.data ?? []).map(w => ({
    id: `withdraw-${w.id}`,
    date: w.created_at,
    sortKey: toSortKey(w.created_at),
    type: 'egreso',
    description: 'Retiro de ahorros',
    amount: w.amount,
  }))

  const penalties: Transaction[] = (penaltyResult.data ?? []).map(p => ({
    id: `penalty-${p.id}`,
    date: p.created_at,
    sortKey: toSortKey(p.created_at),
    type: 'egreso',
    description: penaltyDescriptions[p.reason as PenaltyReason] ?? 'Multa',
    amount: p.amount,
  }))

  transactions.value = [...contribs, ...withdrawals, ...penalties]
    .sort((a, b) => b.sortKey - a.sortKey)

  loading.value = false
}

const totalIngresos = computed(() =>
  transactions.value
    .filter(t => t.type === 'ingreso')
    .reduce((sum, t) => sum + t.amount, 0),
)

const totalEgresos = computed(() =>
  transactions.value
    .filter(t => t.type === 'egreso')
    .reduce((sum, t) => sum + t.amount, 0),
)

const saldoActual = computed(() => Math.max(0, totalIngresos.value - totalEgresos.value))

onMounted(loadTransactions)
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">
        Mis Movimientos
      </h1>
      <p class="text-gray-400 mt-1">
        Historial completo de tus ingresos y egresos en el fondo.
      </p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse bg-gray-900 rounded-2xl h-44 border border-gray-800" />
      <div class="animate-pulse bg-gray-900 rounded-2xl h-64 border border-gray-800" />
    </div>

    <template v-else>
      <!-- Resumen Superior -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-8 mb-6">
        <p class="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Saldo Actual
        </p>
        <p class="text-4xl font-bold text-emerald-400 mt-3">
          {{ formatCOP(saldoActual) }}
        </p>
        <div class="mt-5 grid grid-cols-2 gap-4 max-w-md">
          <div class="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p class="text-[11px] font-medium text-emerald-300/80 uppercase tracking-wider">Ingresos</p>
            <p class="text-lg font-semibold text-emerald-400 mt-1">
              + {{ formatCOP(totalIngresos) }}
            </p>
          </div>
          <div class="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p class="text-[11px] font-medium text-red-300/80 uppercase tracking-wider">Egresos</p>
            <p class="text-lg font-semibold text-red-400 mt-1">
              − {{ formatCOP(totalEgresos) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Línea de Tiempo -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div class="flex items-center justify-between mb-6">
          <p class="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Línea de Tiempo
          </p>
          <span class="text-xs text-gray-500">
            {{ transactions.length }} movimiento{{ transactions.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Vacío -->
        <div v-if="transactions.length === 0" class="text-center py-12">
          <div class="mx-auto h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center">
            <svg class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
            </svg>
          </div>
          <p class="text-sm text-gray-400 mt-4">Aún no hay movimientos registrados.</p>
          <p class="text-xs text-gray-500 mt-1">Cuando registres aportes o retiros aparecerán aquí.</p>
        </div>

        <!-- Timeline -->
        <ol v-else class="relative space-y-2">
          <!-- Línea vertical -->
          <span class="absolute left-[19px] top-2 bottom-2 w-px bg-gray-800" aria-hidden="true" />

          <li
            v-for="tx in transactions"
            :key="tx.id"
            class="relative flex items-center gap-4 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition px-4 py-3"
          >
            <!-- Punto de la línea -->
            <div
              class="relative z-10 shrink-0 h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-gray-900"
              :class="tx.type === 'ingreso'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'"
            >
              <svg
                v-if="tx.type === 'ingreso'"
                class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
              </svg>
              <svg
                v-else
                class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m0 0-6-6m6 6 6-6" />
              </svg>
            </div>

            <!-- Detalle -->
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white truncate">
                {{ tx.description }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ formatDate(tx.date) }}
              </p>
            </div>

            <!-- Monto -->
            <div class="shrink-0 text-right">
              <p
                class="text-sm font-semibold"
                :class="tx.type === 'ingreso' ? 'text-emerald-400' : 'text-red-400'"
              >
                {{ tx.type === 'ingreso' ? '+' : '−' }} {{ formatCOP(tx.amount) }}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </template>
  </div>
</template>
