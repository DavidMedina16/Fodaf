<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const supabase = useSupabase()

const profileName = ref('')
const totalApproved = ref(0)
const totalDeducted = ref(0)
const totalWithdrawn = ref(0)
const allWithdrawals = ref<{ amount: number; status: string; created_at: string }[]>([])
const activeInvestments = ref<{ name: string; invested_amount: number; annual_interest_rate: number; start_date: string; end_date: string }[]>([])
const allContributions = ref<{ amount: number; deposit_date: string; status: string }[]>([])
const pendingPenalties = ref<{ amount: number; reason: string }[]>([])
const loading = ref(true)
const showModal = ref(false)
const showWithdrawalModal = ref(false)
const showHistory = ref(false)
const showWithdrawalsHistory = ref(false)

async function loadData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const [profileResult, approvedResult, allContribResult, deductedResult, pendingPenaltiesResult, withdrawalsResult, investmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('contributions')
      .select('amount')
      .eq('profile_id', user.id)
      .eq('status', 'approved'),
    supabase
      .from('contributions')
      .select('amount, deposit_date, status')
      .eq('profile_id', user.id)
      .order('deposit_date', { ascending: false }),
    supabase
      .from('penalties')
      .select('amount')
      .eq('profile_id', user.id)
      .eq('status', 'deducted_from_savings'),
    supabase
      .from('penalties')
      .select('amount, reason')
      .eq('profile_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('withdrawals')
      .select('amount, status, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('investments')
      .select('name, invested_amount, annual_interest_rate, start_date, end_date')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  if (profileResult.data) {
    profileName.value = profileResult.data.full_name
  }

  totalApproved.value = approvedResult.data
    ? approvedResult.data.reduce((sum, c) => sum + c.amount, 0)
    : 0

  totalDeducted.value = deductedResult.data
    ? deductedResult.data.reduce((sum, p) => sum + p.amount, 0)
    : 0

  allWithdrawals.value = withdrawalsResult.data ?? []

  totalWithdrawn.value = allWithdrawals.value
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0)

  allContributions.value = allContribResult.data ?? []
  pendingPenalties.value = pendingPenaltiesResult.data ?? []
  activeInvestments.value = investmentsResult.data ?? []
  loading.value = false
}

const totalInvested = computed(() =>
  activeInvestments.value.reduce((sum, i) => sum + i.invested_amount, 0),
)

function daysBetween(from: string, to: Date): number {
  const start = new Date(from + 'T00:00:00')
  const diffMs = to.getTime() - start.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function accruedInterest(inv: { invested_amount: number; annual_interest_rate: number; start_date: string; end_date: string }): number {
  const now = new Date()
  const end = new Date(inv.end_date + 'T23:59:59')
  const cutoff = now > end ? end : now
  const elapsed = daysBetween(inv.start_date, cutoff)
  return inv.invested_amount * (inv.annual_interest_rate / 100) * (elapsed / 365)
}

function projectedInterest(inv: { invested_amount: number; annual_interest_rate: number; start_date: string; end_date: string }): number {
  const total = daysBetween(inv.start_date, new Date(inv.end_date + 'T23:59:59'))
  return inv.invested_amount * (inv.annual_interest_rate / 100) * (total / 365)
}

const totalAccruedInterest = computed(() =>
  activeInvestments.value.reduce((sum, i) => sum + accruedInterest(i), 0),
)

const totalSavings = computed(() => Math.max(0, totalApproved.value - totalDeducted.value - totalWithdrawn.value))

const pendingContributions = computed(() =>
  allContributions.value.filter(c => c.status === 'pending'),
)

const pendingContribTotal = computed(() =>
  pendingContributions.value.reduce((sum, c) => sum + c.amount, 0),
)

const pendingPenaltiesTotal = computed(() =>
  pendingPenalties.value.reduce((sum, p) => sum + p.amount, 0),
)

const statusLabel: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
}

const statusClasses: Record<string, string> = {
  approved: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  rejected: 'bg-red-500/20 text-red-400',
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

async function onContributionSaved() {
  await loadData()
}

async function onWithdrawalSaved() {
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Bienvenida -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">
        Bienvenido, {{ profileName }}
      </h1>
      <p class="text-gray-400 mt-1">
        Resumen de tu cuenta en el fondo.
      </p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse bg-gray-900 rounded-2xl h-44 border border-gray-800" />
      <div class="animate-pulse bg-gray-900 rounded-2xl h-32 border border-gray-800" />
    </div>

    <template v-else>
      <!-- Alerta multas pendientes -->
      <div
        v-if="pendingPenalties.length > 0"
        class="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
      >
        <div class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="text-sm font-semibold text-red-400">
              Tienes {{ pendingPenalties.length }} multa{{ pendingPenalties.length > 1 ? 's' : '' }} pendiente{{ pendingPenalties.length > 1 ? 's' : '' }} por un total de {{ formatCOP(pendingPenaltiesTotal) }}
            </p>
            <p class="text-xs text-red-400/70 mt-0.5">Por favor ponte al día para evitar sanciones adicionales.</p>
          </div>
        </div>
      </div>

      <!-- Card Mi Ahorro -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-8">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Mi Ahorro Actual
            </p>
            <p class="text-4xl font-bold text-emerald-400 mt-3">
              {{ formatCOP(totalSavings) }}
            </p>
            <p v-if="totalDeducted > 0" class="text-xs text-red-400 mt-1">
              Incluye {{ formatCOP(totalDeducted) }} descontado por multas.
            </p>
            <p v-else class="text-sm text-gray-500 mt-2">
              Total de aportes aprobados.
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
              @click="showModal = true"
            >
              + Registrar Aporte
            </button>
            <button
              :disabled="totalSavings <= 0"
              class="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              @click="showWithdrawalModal = true"
            >
              Solicitar Retiro
            </button>
            <NuxtLink
              to="/prestamos/solicitar"
              class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
            >
              Solicitar Préstamo
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Historial de Aportes -->
      <div
        v-if="allContributions.length > 0"
        class="mt-4 bg-gray-900 rounded-2xl border border-gray-800 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Historial de Aportes
          </p>
          <div class="flex items-center gap-3">
            <span v-if="pendingContribTotal > 0" class="text-xs font-semibold text-yellow-400">
              {{ pendingContributions.length }} pendiente{{ pendingContributions.length > 1 ? 's' : '' }}
            </span>
            <button
              class="text-xs text-gray-500 hover:text-gray-300 transition"
              @click="showHistory = !showHistory"
            >
              {{ showHistory ? 'Ver menos' : `Ver todos (${allContributions.length})` }}
            </button>
          </div>
        </div>

        <!-- Lista -->
        <ul class="space-y-2">
          <li
            v-for="(contribution, i) in (showHistory ? allContributions : allContributions.slice(0, 5))"
            :key="i"
            class="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="statusClasses[contribution.status] ?? 'bg-gray-500/20 text-gray-400'"
              >
                {{ statusLabel[contribution.status] ?? contribution.status }}
              </span>
              <span class="text-sm text-gray-300">
                {{ formatDate(contribution.deposit_date) }}
              </span>
            </div>
            <span class="text-sm font-medium text-white">
              {{ formatCOP(contribution.amount) }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Inversiones activas del fondo -->
      <div
        v-if="activeInvestments.length > 0"
        class="mt-4 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-violet-600/10 p-6"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-blue-200">Nuestro dinero trabajando</p>
            <p class="text-xs text-blue-300/70">
              Invertido: <span class="font-semibold text-blue-200">{{ formatCOP(totalInvested) }}</span>
              · Rendimiento acumulado:
              <span class="font-semibold text-emerald-300">{{ formatCOP(totalAccruedInterest) }}</span>
            </p>
          </div>
        </div>

        <ul class="space-y-2">
          <li
            v-for="(inv, i) in activeInvestments"
            :key="i"
            class="rounded-lg bg-gray-900/50 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ inv.name }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  Tasa anual: <span class="text-emerald-400 font-medium">{{ inv.annual_interest_rate }}%</span>
                  · Vence {{ formatDate(inv.end_date) }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-semibold text-white">{{ formatCOP(inv.invested_amount) }}</p>
                <p class="text-xs text-emerald-400 mt-0.5">
                  +{{ formatCOP(accruedInterest(inv)) }}
                </p>
              </div>
            </div>
            <p class="text-[11px] text-gray-500 mt-2">
              Proyectado al vencimiento: <span class="text-gray-300 font-medium">{{ formatCOP(projectedInterest(inv)) }}</span>
            </p>
          </li>
        </ul>
      </div>

      <!-- Historial de Retiros -->
      <div
        v-if="allWithdrawals.length > 0"
        class="mt-4 bg-gray-900 rounded-2xl border border-gray-800 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Historial de Retiros
          </p>
          <button
            v-if="allWithdrawals.length > 5"
            class="text-xs text-gray-500 hover:text-gray-300 transition"
            @click="showWithdrawalsHistory = !showWithdrawalsHistory"
          >
            {{ showWithdrawalsHistory ? 'Ver menos' : `Ver todos (${allWithdrawals.length})` }}
          </button>
        </div>

        <ul class="space-y-2">
          <li
            v-for="(withdrawal, i) in (showWithdrawalsHistory ? allWithdrawals : allWithdrawals.slice(0, 5))"
            :key="i"
            class="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="statusClasses[withdrawal.status] ?? 'bg-gray-500/20 text-gray-400'"
              >
                {{ statusLabel[withdrawal.status] ?? withdrawal.status }}
              </span>
              <span class="text-sm text-gray-300">
                {{ formatDate(withdrawal.created_at.slice(0, 10)) }}
              </span>
            </div>
            <span class="text-sm font-medium text-white">
              {{ formatCOP(withdrawal.amount) }}
            </span>
          </li>
        </ul>
      </div>
    </template>

    <!-- Modal -->
    <ContributionModal
      :visible="showModal"
      @close="showModal = false"
      @saved="onContributionSaved"
    />

    <WithdrawalModal
      :visible="showWithdrawalModal"
      :available-savings="totalSavings"
      @close="showWithdrawalModal = false"
      @saved="onWithdrawalSaved"
    />
  </div>
</template>
