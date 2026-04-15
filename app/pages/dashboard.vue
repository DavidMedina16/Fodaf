<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const supabase = useSupabase()

const profileName = ref('')
const totalApproved = ref(0)
const totalDeducted = ref(0)
const allContributions = ref<{ amount: number; deposit_date: string; status: string }[]>([])
const pendingPenalties = ref<{ amount: number; reason: string }[]>([])
const loading = ref(true)
const showModal = ref(false)
const showHistory = ref(false)

async function loadData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const [profileResult, approvedResult, allContribResult, deductedResult, pendingPenaltiesResult] = await Promise.all([
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

  allContributions.value = allContribResult.data ?? []
  pendingPenalties.value = pendingPenaltiesResult.data ?? []
  loading.value = false
}

const totalSavings = computed(() => Math.max(0, totalApproved.value - totalDeducted.value))

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
          <div class="flex shrink-0 gap-2">
            <button
              class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
              @click="showModal = true"
            >
              + Registrar Aporte
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
    </template>

    <!-- Modal -->
    <ContributionModal
      :visible="showModal"
      @close="showModal = false"
      @saved="onContributionSaved"
    />
  </div>
</template>
