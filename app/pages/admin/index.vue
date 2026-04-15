<script setup lang="ts">
interface PendingContribution {
  id: string
  amount: number
  deposit_date: string
  created_at: string
  profiles: {
    full_name: string
  }
}

interface PendingLoan {
  id: string
  requested_amount: number
  interest_rate: number
  installments: number
  guarantor_id: string | null
  created_at: string
  profiles: {
    full_name: string
  }
  guarantor: {
    full_name: string
  } | null
}

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()

const activeTab = ref<'contributions' | 'loans'>('contributions')
const contributions = ref<PendingContribution[]>([])
const loans = ref<PendingLoan[]>([])
const loading = ref(true)
const processingId = ref<string | null>(null)

async function loadPending() {
  const [contribResult, loansResult] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, amount, deposit_date, created_at, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('loans')
      .select('id, requested_amount, interest_rate, installments, guarantor_id, created_at, profiles!loans_profile_id_fkey(full_name), guarantor:profiles!loans_guarantor_id_fkey(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ])

  contributions.value = (contribResult.data as PendingContribution[]) ?? []
  loans.value = (loansResult.data as PendingLoan[]) ?? []
  loading.value = false
}

async function updateContribution(id: string, status: 'approved' | 'rejected') {
  processingId.value = id

  const { error } = await supabase
    .from('contributions')
    .update({ status })
    .eq('id', id)

  if (error) {
    toast.error('Error al actualizar el aporte.')
    processingId.value = null
    return
  }

  contributions.value = contributions.value.filter(c => c.id !== id)
  processingId.value = null
  toast.success(status === 'approved' ? 'Aporte aprobado.' : 'Aporte rechazado.')
}

async function updateLoan(id: string, status: 'active' | 'rejected') {
  processingId.value = id

  const { error } = await supabase
    .from('loans')
    .update({ status })
    .eq('id', id)

  if (error) {
    toast.error('Error al actualizar el préstamo.')
    processingId.value = null
    return
  }

  loans.value = loans.value.filter(l => l.id !== id)
  processingId.value = null
  toast.success(status === 'active' ? 'Préstamo aprobado.' : 'Préstamo rechazado.')
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
    month: 'short',
    year: 'numeric',
  })
}

const pendingContributionsCount = computed(() => contributions.value.length)
const pendingLoansCount = computed(() => loans.value.length)

onMounted(loadPending)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Panel de Administración</h1>
      <p class="text-gray-400 mt-1">Gestión de aportes y préstamos pendientes.</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
      <button
        class="px-5 py-2 text-sm font-medium rounded-lg transition"
        :class="activeTab === 'contributions'
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:text-white'"
        @click="activeTab = 'contributions'"
      >
        Aportes
        <span
          v-if="pendingContributionsCount > 0"
          class="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-400"
        >
          {{ pendingContributionsCount }}
        </span>
      </button>
      <button
        class="px-5 py-2 text-sm font-medium rounded-lg transition"
        :class="activeTab === 'loans'
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:text-white'"
        @click="activeTab = 'loans'"
      >
        Préstamos
        <span
          v-if="pendingLoansCount > 0"
          class="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400"
        >
          {{ pendingLoansCount }}
        </span>
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse bg-gray-900 rounded-xl h-20 border border-gray-800"
      />
    </div>

    <!-- ==================== APORTES ==================== -->
    <template v-else-if="activeTab === 'contributions'">
      <!-- Empty -->
      <div
        v-if="contributions.length === 0"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
      >
        <p class="text-gray-400 text-lg">No hay aportes pendientes de revisión.</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-800">
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Miembro</th>
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Fecha de Depósito</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Monto</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in contributions"
              :key="c.id"
              class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
            >
              <td class="px-6 py-4">
                <span class="text-sm font-medium text-white">{{ c.profiles.full_name }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-300">{{ formatDate(c.deposit_date) }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <span class="text-sm font-semibold text-white">{{ formatCOP(c.amount) }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    :disabled="processingId === c.id"
                    class="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="updateContribution(c.id, 'approved')"
                  >
                    Aprobar
                  </button>
                  <button
                    :disabled="processingId === c.id"
                    class="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="updateContribution(c.id, 'rejected')"
                  >
                    Rechazar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ==================== PRÉSTAMOS ==================== -->
    <template v-else-if="activeTab === 'loans'">
      <!-- Empty -->
      <div
        v-if="loans.length === 0"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
      >
        <p class="text-gray-400 text-lg">No hay solicitudes de préstamos pendientes.</p>
      </div>

      <!-- Cards -->
      <div v-else class="space-y-4">
        <div
          v-for="loan in loans"
          :key="loan.id"
          class="bg-gray-900 rounded-2xl border border-gray-800 p-6"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-lg font-semibold text-white">{{ loan.profiles.full_name }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Solicitado el {{ formatDate(loan.created_at.slice(0, 10)) }}</p>
            </div>
            <p class="text-2xl font-bold text-white">{{ formatCOP(loan.requested_amount) }}</p>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-5">
            <div class="rounded-lg bg-gray-800/50 px-4 py-3">
              <p class="text-xs text-gray-400 uppercase tracking-wider">Interés</p>
              <p class="text-sm font-semibold text-white mt-1">{{ loan.interest_rate }}%</p>
            </div>
            <div class="rounded-lg bg-gray-800/50 px-4 py-3">
              <p class="text-xs text-gray-400 uppercase tracking-wider">Cuotas</p>
              <p class="text-sm font-semibold text-white mt-1">{{ loan.installments }}</p>
            </div>
            <div class="rounded-lg bg-gray-800/50 px-4 py-3">
              <p class="text-xs text-gray-400 uppercase tracking-wider">Codeudor</p>
              <p class="text-sm font-semibold mt-1" :class="loan.guarantor ? 'text-white' : 'text-gray-500'">
                {{ loan.guarantor?.full_name ?? 'No aplica' }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button
              :disabled="processingId === loan.id"
              class="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              @click="updateLoan(loan.id, 'active')"
            >
              Aprobar
            </button>
            <button
              :disabled="processingId === loan.id"
              class="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              @click="updateLoan(loan.id, 'rejected')"
            >
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
