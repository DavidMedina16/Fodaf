<script setup lang="ts">
interface LoanWithPayments {
  id: string
  requested_amount: number
  interest_rate: number
  installments: number
  guarantor_id: string | null
  status: string
  created_at: string
  guarantor: {
    full_name: string
  } | null
  loan_payments: {
    amount: number
    payment_date: string
  }[]
}

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const supabase = useSupabase()

const loans = ref<LoanWithPayments[]>([])
const loading = ref(true)
const paymentModalVisible = ref(false)
const selectedLoanId = ref('')
const selectedLoanBalance = ref(0)
const expandedPayments = ref<Set<string>>(new Set())

function togglePayments(loanId: string) {
  if (expandedPayments.value.has(loanId)) {
    expandedPayments.value.delete(loanId)
  } else {
    expandedPayments.value.add(loanId)
  }
}

async function loadLoans() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('loans')
    .select('id, requested_amount, interest_rate, installments, guarantor_id, status, created_at, guarantor:profiles!loans_guarantor_id_fkey(full_name), loan_payments(amount, payment_date)')
    .eq('profile_id', user.id)
    .in('status', ['active', 'pending', 'paid'])
    .order('created_at', { ascending: false })

  loans.value = (data as LoanWithPayments[]) ?? []
  loading.value = false
}

function totalDue(loan: LoanWithPayments): number {
  return Math.round(loan.requested_amount * (1 + loan.interest_rate / 100))
}

function totalPaid(loan: LoanWithPayments): number {
  return loan.loan_payments.reduce((sum, p) => sum + p.amount, 0)
}

function remainingBalance(loan: LoanWithPayments): number {
  return Math.max(0, totalDue(loan) - totalPaid(loan))
}

function progressPercent(loan: LoanWithPayments): number {
  const total = totalDue(loan)
  if (total === 0) return 0
  return Math.min(100, Math.round((totalPaid(loan) / total) * 100))
}

function openPaymentModal(loan: LoanWithPayments) {
  selectedLoanId.value = loan.id
  selectedLoanBalance.value = remainingBalance(loan)
  paymentModalVisible.value = true
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const activeLoans = computed(() => loans.value.filter(l => l.status === 'active'))
const pendingLoans = computed(() => loans.value.filter(l => l.status === 'pending'))
const paidLoans = computed(() => loans.value.filter(l => l.status === 'paid'))

onMounted(loadLoans)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Mis Préstamos</h1>
      <p class="text-gray-400 mt-1">Estado de tus deudas activas y solicitudes pendientes.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div
        v-for="i in 2"
        :key="i"
        class="animate-pulse bg-gray-900 rounded-2xl h-48 border border-gray-800"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="loans.length === 0"
      class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
    >
      <p class="text-gray-400 text-lg mb-4">No tienes préstamos activos ni solicitudes pendientes.</p>
      <NuxtLink
        to="/prestamos/solicitar"
        class="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
      >
        Solicitar Préstamo
      </NuxtLink>
    </div>

    <template v-else>
      <!-- ==================== ACTIVOS ==================== -->
      <div v-if="activeLoans.length > 0" class="space-y-4 mb-8">
        <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Préstamos Activos</h2>
        <div
          v-for="loan in activeLoans"
          :key="loan.id"
          class="bg-gray-900 rounded-2xl border border-gray-800 p-6"
        >
          <div class="flex items-start justify-between mb-5">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-lg font-semibold text-white">{{ formatCOP(loan.requested_amount) }}</p>
                <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                  Activo
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">Solicitado el {{ formatDate(loan.created_at) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-400">Saldo Pendiente</p>
              <p class="text-2xl font-bold text-white mt-0.5">{{ formatCOP(remainingBalance(loan)) }}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-4 gap-3 mb-5">
            <div class="rounded-lg bg-gray-800/50 px-4 py-3">
              <p class="text-xs text-gray-400 uppercase tracking-wider">Total a Pagar</p>
              <p class="text-sm font-semibold text-white mt-1">{{ formatCOP(totalDue(loan)) }}</p>
            </div>
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

          <!-- Progress bar -->
          <div class="mb-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-400">Progreso de pago</span>
              <span class="text-xs font-semibold text-white">{{ progressPercent(loan) }}%</span>
            </div>
            <div
              style="height: 12px; border-radius: 9999px; background-color: rgb(31, 41, 55);"
            >
              <div
                style="height: 12px; border-radius: 9999px;"
                :style="`width: ${progressPercent(loan)}%; background-color: ${progressPercent(loan) >= 100 ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'};`"
              />
            </div>
            <div class="flex items-center justify-between mt-1.5">
              <span class="text-xs text-gray-500">{{ formatCOP(totalPaid(loan)) }} pagado</span>
              <span class="text-xs text-gray-500">{{ formatCOP(totalDue(loan)) }} total</span>
            </div>
          </div>

          <!-- Historial de pagos -->
          <div v-if="loan.loan_payments.length > 0" class="mb-5">
            <button
              class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
              @click="togglePayments(loan.id)"
            >
              <svg
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-90': expandedPayments.has(loan.id) }"
                fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              Historial de pagos ({{ loan.loan_payments.length }})
            </button>
            <ul v-if="expandedPayments.has(loan.id)" class="mt-3 space-y-2">
              <li
                v-for="(payment, i) in [...loan.loan_payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date))"
                :key="i"
                class="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3"
              >
                <div class="flex items-center gap-3">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span class="text-sm text-gray-300">{{ formatDate(payment.payment_date) }}</span>
                </div>
                <span class="text-sm font-medium text-emerald-400">{{ formatCOP(payment.amount) }}</span>
              </li>
            </ul>
          </div>
          <div v-else class="mb-5">
            <p class="text-xs text-gray-500">Aún no hay pagos registrados.</p>
          </div>

          <!-- Botón abonar -->
          <button
            class="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
            @click="openPaymentModal(loan)"
          >
            Abonar a la Deuda
          </button>
        </div>
      </div>

      <!-- ==================== PENDIENTES ==================== -->
      <div v-if="pendingLoans.length > 0" class="space-y-4 mb-8">
        <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Solicitudes en Revisión</h2>
        <div
          v-for="loan in pendingLoans"
          :key="loan.id"
          class="bg-gray-900 rounded-2xl border border-dashed border-gray-700 p-6 opacity-75"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-lg font-semibold text-white">{{ formatCOP(loan.requested_amount) }}</p>
                <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
                  En Revisión
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">Solicitado el {{ formatDate(loan.created_at) }}</p>
            </div>
            <div class="text-right text-sm text-gray-400">
              <p>{{ loan.interest_rate }}% interés &middot; {{ loan.installments }} cuotas</p>
              <p v-if="loan.guarantor" class="mt-0.5">Codeudor: {{ loan.guarantor.full_name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== PAGADOS ==================== -->
      <div v-if="paidLoans.length > 0" class="space-y-4">
        <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Préstamos Pagados</h2>
        <div
          v-for="loan in paidLoans"
          :key="loan.id"
          class="bg-gray-900 rounded-2xl border border-gray-800 p-6 opacity-60"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-lg font-semibold text-white">{{ formatCOP(loan.requested_amount) }}</p>
                <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
                  Pagado
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">Solicitado el {{ formatDate(loan.created_at) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Total pagado</p>
              <p class="text-lg font-semibold text-gray-400 mt-0.5">{{ formatCOP(totalDue(loan)) }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal de pago -->
    <LoanPaymentModal
      :visible="paymentModalVisible"
      :loan-id="selectedLoanId"
      :remaining-balance="selectedLoanBalance"
      @close="paymentModalVisible = false"
      @saved="loadLoans"
    />
  </div>
</template>
