<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const FONDO_BASE = 300_000

interface SettlementRow {
  profile_id: string
  full_name: string
  real_savings: number
  bonus: number
  total: number
}

const supabase = useSupabase()
const toast = useToast()

const loading = ref(true)
const totalActivityProfits = ref(0)
const totalPenaltiesCollected = ref(0)
const settlement = ref<SettlementRow[]>([])

const currentYear = new Date().getFullYear()

async function loadData() {
  const [
    profilesResult,
    activitiesResult,
    penaltiesCollectedResult,
    contribResult,
    withdrawResult,
    penaltiesDeductedResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name'),
    supabase
      .from('activities')
      .select('net_profits'),
    supabase
      .from('penalties')
      .select('amount')
      .in('status', ['paid', 'deducted_from_savings']),
    supabase
      .from('contributions')
      .select('profile_id, amount')
      .eq('status', 'approved'),
    supabase
      .from('withdrawals')
      .select('profile_id, amount')
      .eq('status', 'approved'),
    supabase
      .from('penalties')
      .select('profile_id, amount')
      .eq('status', 'deducted_from_savings'),
  ])

  totalActivityProfits.value = (activitiesResult.data ?? [])
    .reduce((sum, a) => sum + Number(a.net_profits ?? 0), 0)

  totalPenaltiesCollected.value = (penaltiesCollectedResult.data ?? [])
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)

  const contribByProfile = new Map<string, number>()
  for (const c of (contribResult.data ?? [])) {
    contribByProfile.set(c.profile_id, (contribByProfile.get(c.profile_id) ?? 0) + Number(c.amount))
  }

  const withdrawByProfile = new Map<string, number>()
  for (const w of (withdrawResult.data ?? [])) {
    withdrawByProfile.set(w.profile_id, (withdrawByProfile.get(w.profile_id) ?? 0) + Number(w.amount))
  }

  const penaltyByProfile = new Map<string, number>()
  for (const p of (penaltiesDeductedResult.data ?? [])) {
    penaltyByProfile.set(p.profile_id, (penaltyByProfile.get(p.profile_id) ?? 0) + Number(p.amount))
  }

  const profiles = profilesResult.data ?? []
  const totalExtra = totalActivityProfits.value + totalPenaltiesCollected.value
  const utility = Math.max(0, totalExtra - FONDO_BASE)
  const bonus = profiles.length > 0 ? utility / profiles.length : 0

  settlement.value = profiles.map(p => {
    const realSavings = Math.max(
      0,
      (contribByProfile.get(p.id) ?? 0)
        - (withdrawByProfile.get(p.id) ?? 0)
        - (penaltyByProfile.get(p.id) ?? 0),
    )
    return {
      profile_id: p.id,
      full_name: p.full_name,
      real_savings: realSavings,
      bonus,
      total: realSavings + bonus,
    }
  })

  loading.value = false
}

const totalExtraIncome = computed(
  () => totalActivityProfits.value + totalPenaltiesCollected.value,
)

const utilityToDistribute = computed(
  () => Math.max(0, totalExtraIncome.value - FONDO_BASE),
)

const baseNotReached = computed(() => totalExtraIncome.value < FONDO_BASE)

const memberCount = computed(() => settlement.value.length)

const bonusPerMember = computed(
  () => memberCount.value > 0 ? utilityToDistribute.value / memberCount.value : 0,
)

const grandTotalToTransfer = computed(
  () => settlement.value.reduce((sum, r) => sum + r.total, 0),
)

function handleExportPdf() {
  toast.success('La exportación a PDF estará disponible próximamente.')
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Header festivo -->
    <div class="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-emerald-500/10 p-8 mb-8">
      <div class="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true" />
      <div class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />

      <div class="relative flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </span>
            <span class="text-[11px] uppercase tracking-widest text-amber-300/80 font-semibold">
              Cierre {{ currentYear }}
            </span>
          </div>
          <h1 class="text-3xl font-bold text-white">Liquidación de Fin de Año</h1>
          <p class="text-gray-400 mt-1 max-w-2xl">
            Cálculo del reparto de utilidades entre los miembros del fondo según los estatutos.
            Se retiene una base de {{ formatCOP(FONDO_BASE) }} para arrancar el siguiente ciclo.
          </p>
        </div>
        <button
          class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition"
          @click="handleExportPdf"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exportar Liquidación a PDF
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="animate-pulse h-32 bg-gray-900 rounded-2xl border border-gray-800" />
        <div class="animate-pulse h-32 bg-gray-900 rounded-2xl border border-gray-800" />
        <div class="animate-pulse h-32 bg-gray-900 rounded-2xl border border-gray-800" />
      </div>
      <div class="animate-pulse h-72 bg-gray-900 rounded-2xl border border-gray-800" />
    </div>

    <template v-else>
      <!-- Aviso si no se supera la base -->
      <div
        v-if="baseNotReached"
        class="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 flex items-start gap-3"
      >
        <svg class="h-6 w-6 shrink-0 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-yellow-400">
            Aún no se supera la base del fondo.
          </p>
          <p class="text-xs text-yellow-400/70 mt-1">
            Los ingresos extra ({{ formatCOP(totalExtraIncome) }}) no superan la base intocable
            de {{ formatCOP(FONDO_BASE) }}, por lo que aún no hay utilidades para repartir.
          </p>
        </div>
      </div>

      <!-- Cards de resumen -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Total ingresos extra -->
        <div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </span>
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total Ingresos Extra
            </p>
          </div>
          <p class="text-2xl font-bold text-white">
            {{ formatCOP(totalExtraIncome) }}
          </p>
          <div class="mt-3 space-y-1 text-xs text-gray-400">
            <p class="flex justify-between">
              <span>Actividades</span>
              <span class="text-gray-300 font-medium">{{ formatCOP(totalActivityProfits) }}</span>
            </p>
            <p class="flex justify-between">
              <span>Multas recaudadas</span>
              <span class="text-gray-300 font-medium">{{ formatCOP(totalPenaltiesCollected) }}</span>
            </p>
          </div>
        </div>

        <!-- Base retenida -->
        <div class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-500/20 text-gray-300">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Base Retenida
            </p>
          </div>
          <p class="text-2xl font-bold text-white">
            {{ formatCOP(FONDO_BASE) }}
          </p>
          <p class="text-xs text-gray-500 mt-3">
            Capital que queda en el fondo para arrancar el siguiente año.
          </p>
        </div>

        <!-- Utilidad a repartir -->
        <div class="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/40">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </span>
            <p class="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Utilidad a Repartir
            </p>
          </div>
          <p class="text-3xl font-bold text-emerald-400">
            {{ formatCOP(utilityToDistribute) }}
          </p>
          <p class="text-xs text-emerald-300/80 mt-3">
            {{ memberCount }} miembro{{ memberCount === 1 ? '' : 's' }} · Bono c/u:
            <span class="font-semibold text-emerald-300">{{ formatCOP(bonusPerMember) }}</span>
          </p>
        </div>
      </div>

      <!-- Tabla de liquidación -->
      <div class="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <p class="text-sm font-semibold text-white">Tabla de Liquidación</p>
            <p class="text-xs text-gray-500 mt-0.5">
              Detalle del monto a consignar a cada miembro.
            </p>
          </div>
          <span class="text-xs text-gray-500">
            {{ memberCount }} miembro{{ memberCount === 1 ? '' : 's' }}
          </span>
        </div>

        <div v-if="memberCount === 0" class="px-6 py-12 text-center text-sm text-gray-400">
          No hay miembros registrados en el fondo.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-950/40 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <tr>
                <th class="px-6 py-3 text-left">Miembro</th>
                <th class="px-6 py-3 text-right">Ahorro Real</th>
                <th class="px-6 py-3 text-right">Bono de Utilidad</th>
                <th class="px-6 py-3 text-right">Total a Consignar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800">
              <tr
                v-for="row in settlement"
                :key="row.profile_id"
                class="hover:bg-gray-800/40 transition"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-white">{{ row.full_name }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-300">{{ formatCOP(row.real_savings) }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span
                    class="text-sm"
                    :class="row.bonus > 0 ? 'text-emerald-400 font-medium' : 'text-gray-500'"
                  >
                    {{ row.bonus > 0 ? `+ ${formatCOP(row.bonus)}` : formatCOP(0) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm font-semibold text-white">{{ formatCOP(row.total) }}</span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-950/40 border-t border-gray-800">
              <tr>
                <td class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gran total
                </td>
                <td class="px-6 py-3" />
                <td class="px-6 py-3" />
                <td class="px-6 py-3 text-right">
                  <span class="text-sm font-bold text-emerald-400">
                    {{ formatCOP(grandTotalToTransfer) }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
