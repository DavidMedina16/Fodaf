<script setup lang="ts">
interface ProfileOption {
  id: string
  full_name: string
}

interface AdminContribution {
  id: string
  profile_id: string
  amount: number
  deposit_date: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: { full_name: string }
}

interface AdminLoan {
  id: string
  profile_id: string
  guarantor_id: string | null
  requested_amount: number
  interest_rate: number
  installments: number
  status: 'pending' | 'active' | 'paid' | 'defaulted' | 'rejected'
  created_at: string
  profiles: { full_name: string }
  guarantor: { full_name: string } | null
}

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()

const activeTab = ref<'contributions' | 'loans'>('contributions')
const contributions = ref<AdminContribution[]>([])
const loans = ref<AdminLoan[]>([])
const profiles = ref<ProfileOption[]>([])
const loading = ref(true)
const processingId = ref<string | null>(null)

const contribFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')
const loanFilter = ref<'all' | 'pending' | 'active' | 'paid' | 'defaulted' | 'rejected'>('pending')

// Modales de edición
const editingContribution = ref<AdminContribution | null>(null)
const editingLoan = ref<AdminLoan | null>(null)
const saving = ref(false)

// Modal de confirmación de borrado
const deleteTarget = ref<{ kind: 'contribution' | 'loan' | 'payment'; id: string; label: string } | null>(null)
const deleting = ref(false)

// Gestión de pagos
interface LoanPayment {
  id: string
  loan_id: string
  amount: number
  payment_date: string
}
const paymentsLoan = ref<AdminLoan | null>(null)
const paymentsList = ref<LoanPayment[]>([])
const paymentsLoading = ref(false)
const editingPayment = ref<LoanPayment | null>(null)

async function loadData() {
  loading.value = true
  const [contribResult, loansResult, profilesResult] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, profile_id, amount, deposit_date, status, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('loans')
      .select('id, profile_id, guarantor_id, requested_amount, interest_rate, installments, status, created_at, profiles!loans_profile_id_fkey(full_name), guarantor:profiles!loans_guarantor_id_fkey(full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ])

  contributions.value = (contribResult.data as unknown as AdminContribution[]) ?? []
  loans.value = (loansResult.data as unknown as AdminLoan[]) ?? []
  profiles.value = (profilesResult.data as unknown as ProfileOption[]) ?? []
  loading.value = false
}

const filteredContributions = computed(() =>
  contribFilter.value === 'all'
    ? contributions.value
    : contributions.value.filter(c => c.status === contribFilter.value),
)

const filteredLoans = computed(() =>
  loanFilter.value === 'all'
    ? loans.value
    : loans.value.filter(l => l.status === loanFilter.value),
)

async function setContributionStatus(id: string, status: 'approved' | 'rejected') {
  processingId.value = id
  const { error } = await supabase.from('contributions').update({ status }).eq('id', id)
  processingId.value = null

  if (error) {
    toast.error('Error al actualizar el aporte.')
    return
  }

  toast.success(status === 'approved' ? 'Aporte aprobado.' : 'Aporte rechazado.')
  await loadData()
}

async function setLoanStatus(id: string, status: 'active' | 'rejected') {
  processingId.value = id
  const { error } = await supabase.from('loans').update({ status }).eq('id', id)
  processingId.value = null

  if (error) {
    toast.error('Error al actualizar el préstamo.')
    return
  }

  toast.success(status === 'active' ? 'Préstamo aprobado.' : 'Préstamo rechazado.')
  await loadData()
}

// ---------- Edición de aportes ----------
function openEditContribution(c: AdminContribution) {
  editingContribution.value = { ...c }
}

function closeEditContribution() {
  editingContribution.value = null
}

async function saveContribution() {
  if (!editingContribution.value) return
  saving.value = true
  const c = editingContribution.value
  const { error } = await supabase
    .from('contributions')
    .update({
      profile_id: c.profile_id,
      amount: c.amount,
      deposit_date: c.deposit_date,
      status: c.status,
    })
    .eq('id', c.id)
  saving.value = false

  if (error) {
    toast.error('Error al guardar el aporte.')
    return
  }

  toast.success('Aporte actualizado.')
  closeEditContribution()
  await loadData()
}

// ---------- Edición de préstamos ----------
function openEditLoan(l: AdminLoan) {
  editingLoan.value = { ...l }
}

function closeEditLoan() {
  editingLoan.value = null
}

async function saveLoan() {
  if (!editingLoan.value) return
  saving.value = true
  const l = editingLoan.value
  const { error } = await supabase
    .from('loans')
    .update({
      profile_id: l.profile_id,
      guarantor_id: l.guarantor_id || null,
      requested_amount: l.requested_amount,
      interest_rate: l.interest_rate,
      installments: l.installments,
      status: l.status,
    })
    .eq('id', l.id)
  saving.value = false

  if (error) {
    toast.error('Error al guardar el préstamo.')
    return
  }

  toast.success('Préstamo actualizado.')
  closeEditLoan()
  await loadData()
}

// ---------- Pagos de préstamo ----------
async function openPayments(loan: AdminLoan) {
  paymentsLoan.value = loan
  paymentsLoading.value = true
  const { data } = await supabase
    .from('loan_payments')
    .select('id, loan_id, amount, payment_date')
    .eq('loan_id', loan.id)
    .order('payment_date', { ascending: false })
  paymentsList.value = (data as LoanPayment[]) ?? []
  paymentsLoading.value = false
}

function closePayments() {
  paymentsLoan.value = null
  paymentsList.value = []
  editingPayment.value = null
}

function startEditPayment(p: LoanPayment) {
  editingPayment.value = { ...p }
}

async function savePayment() {
  if (!editingPayment.value) return
  saving.value = true
  const p = editingPayment.value
  const { error } = await supabase
    .from('loan_payments')
    .update({ amount: p.amount, payment_date: p.payment_date })
    .eq('id', p.id)
  saving.value = false
  if (error) {
    toast.error('Error al guardar el pago.')
    return
  }
  toast.success('Pago actualizado.')
  editingPayment.value = null
  if (paymentsLoan.value) await openPayments(paymentsLoan.value)
}

function askDeletePayment(p: LoanPayment) {
  deleteTarget.value = {
    kind: 'payment',
    id: p.id,
    label: `el pago de ${formatCOP(p.amount)} del ${formatDate(p.payment_date)}`,
  }
}

// ---------- Eliminación ----------
function askDeleteContribution(c: AdminContribution) {
  deleteTarget.value = {
    kind: 'contribution',
    id: c.id,
    label: `el aporte de ${c.profiles.full_name} (${formatCOP(c.amount)})`,
  }
}

function askDeleteLoan(l: AdminLoan) {
  deleteTarget.value = {
    kind: 'loan',
    id: l.id,
    label: `el préstamo de ${l.profiles.full_name} (${formatCOP(l.requested_amount)})`,
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const kind = deleteTarget.value.kind
  const table = kind === 'contribution' ? 'contributions' : kind === 'loan' ? 'loans' : 'loan_payments'
  const { error } = await supabase.from(table).delete().eq('id', deleteTarget.value.id)
  deleting.value = false

  if (error) {
    toast.error(`No se pudo eliminar: ${error.message}`)
    return
  }

  toast.success('Registro eliminado.')
  deleteTarget.value = null
  if (kind === 'payment' && paymentsLoan.value) {
    await openPayments(paymentsLoan.value)
  } else {
    await loadData()
  }
}

// ---------- Helpers ----------
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
    month: 'short',
    year: 'numeric',
  })
}

const contribStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const contribStatusClasses: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const loanStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  paid: 'Pagado',
  defaulted: 'En mora',
  rejected: 'Rechazado',
}

const loanStatusClasses: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  paid: 'bg-gray-500/20 text-gray-400',
  defaulted: 'bg-red-500/20 text-red-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const pendingContributionsCount = computed(() => contributions.value.filter(c => c.status === 'pending').length)
const pendingLoansCount = computed(() => loans.value.filter(l => l.status === 'pending').length)

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Panel de Administración</h1>
      <p class="text-gray-400 mt-1">Gestión completa de aportes y préstamos.</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
      <button
        class="px-5 py-2 text-sm font-medium rounded-lg transition"
        :class="activeTab === 'contributions' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'"
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
        :class="activeTab === 'loans' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'"
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
      <div v-for="i in 3" :key="i" class="animate-pulse bg-gray-900 rounded-xl h-20 border border-gray-800" />
    </div>

    <!-- ==================== APORTES ==================== -->
    <template v-else-if="activeTab === 'contributions'">
      <!-- Filtros -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="f in (['pending', 'approved', 'rejected', 'all'] as const)"
          :key="f"
          class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
          :class="contribFilter === f
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'"
          @click="contribFilter = f"
        >
          {{ f === 'all' ? 'Todos' : contribStatusLabels[f] }}
        </button>
      </div>

      <div
        v-if="filteredContributions.length === 0"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
      >
        <p class="text-gray-400 text-lg">No hay aportes para mostrar.</p>
      </div>

      <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-800">
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Miembro</th>
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Fecha</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Monto</th>
              <th class="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Estado</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredContributions"
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
              <td class="px-6 py-4 text-center">
                <span class="px-2 py-0.5 text-xs font-medium rounded-full" :class="contribStatusClasses[c.status]">
                  {{ contribStatusLabels[c.status] }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <template v-if="c.status === 'pending'">
                    <button
                      :disabled="processingId === c.id"
                      class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                      @click="setContributionStatus(c.id, 'approved')"
                    >
                      Aprobar
                    </button>
                    <button
                      :disabled="processingId === c.id"
                      class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
                      @click="setContributionStatus(c.id, 'rejected')"
                    >
                      Rechazar
                    </button>
                  </template>
                  <button
                    class="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                    title="Editar"
                    @click="openEditContribution(c)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    class="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                    title="Eliminar"
                    @click="askDeleteContribution(c)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
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
      <!-- Filtros -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="f in (['pending', 'active', 'paid', 'defaulted', 'rejected', 'all'] as const)"
          :key="f"
          class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
          :class="loanFilter === f
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'"
          @click="loanFilter = f"
        >
          {{ f === 'all' ? 'Todos' : loanStatusLabels[f] }}
        </button>
      </div>

      <div
        v-if="filteredLoans.length === 0"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
      >
        <p class="text-gray-400 text-lg">No hay préstamos para mostrar.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="loan in filteredLoans"
          :key="loan.id"
          class="bg-gray-900 rounded-2xl border border-gray-800 p-6"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-lg font-semibold text-white">{{ loan.profiles.full_name }}</p>
                <span class="px-2 py-0.5 text-xs font-medium rounded-full" :class="loanStatusClasses[loan.status]">
                  {{ loanStatusLabels[loan.status] }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">Solicitado el {{ formatDate(loan.created_at) }}</p>
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
            <template v-if="loan.status === 'pending'">
              <button
                :disabled="processingId === loan.id"
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                @click="setLoanStatus(loan.id, 'active')"
              >
                Aprobar
              </button>
              <button
                :disabled="processingId === loan.id"
                class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
                @click="setLoanStatus(loan.id, 'rejected')"
              >
                Rechazar
              </button>
            </template>
            <button
              v-if="loan.status === 'active' || loan.status === 'paid'"
              class="rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition"
              @click="openPayments(loan)"
            >
              Pagos
            </button>
            <button
              class="rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-600 transition"
              @click="openEditLoan(loan)"
            >
              Editar
            </button>
            <button
              class="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
              @click="askDeleteLoan(loan)"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== MODAL EDITAR APORTE ==================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingContribution" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="closeEditContribution" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Aporte</h2>
            <form class="space-y-4" @submit.prevent="saveContribution">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Miembro</label>
                <select
                  v-model="editingContribution.profile_id"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.full_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Monto (COP)</label>
                <input
                  v-model.number="editingContribution.amount"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Fecha de depósito</label>
                <input
                  v-model="editingContribution.deposit_date"
                  type="date"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <select
                  v-model="editingContribution.status"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="closeEditContribution"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {{ saving ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ==================== MODAL EDITAR PRÉSTAMO ==================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingLoan" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="closeEditLoan" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Préstamo</h2>
            <form class="space-y-4" @submit.prevent="saveLoan">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Miembro</label>
                <select
                  v-model="editingLoan.profile_id"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.full_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Monto solicitado (COP)</label>
                <input
                  v-model.number="editingLoan.requested_amount"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Interés (%)</label>
                  <input
                    v-model.number="editingLoan.interest_rate"
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Cuotas</label>
                  <input
                    v-model.number="editingLoan.installments"
                    type="number"
                    min="1"
                    required
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Codeudor</label>
                <select
                  v-model="editingLoan.guarantor_id"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option :value="null">Sin codeudor</option>
                  <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.full_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <select
                  v-model="editingLoan.status"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="pending">Pendiente</option>
                  <option value="active">Activo</option>
                  <option value="paid">Pagado</option>
                  <option value="defaulted">En mora</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="closeEditLoan"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {{ saving ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal gestión de pagos -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="paymentsLoan" class="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
          <div class="absolute inset-0 bg-black/60" @click="closePayments" />
          <div class="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h2 class="text-xl font-bold text-white">Pagos del Préstamo</h2>
                <p class="text-sm text-gray-400 mt-0.5">
                  {{ paymentsLoan.profiles.full_name }} · {{ formatCOP(paymentsLoan.requested_amount) }}
                </p>
              </div>
              <button class="text-gray-500 hover:text-white transition" @click="closePayments">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <div v-if="paymentsLoading" class="space-y-2">
              <div v-for="i in 2" :key="i" class="animate-pulse bg-gray-800 rounded-lg h-12" />
            </div>

            <div v-else-if="paymentsList.length === 0" class="text-center py-8 text-gray-400 text-sm">
              No hay pagos registrados para este préstamo.
            </div>

            <ul v-else class="space-y-2 max-h-96 overflow-y-auto">
              <li
                v-for="p in paymentsList"
                :key="p.id"
                class="rounded-lg bg-gray-800/50 px-4 py-3"
              >
                <template v-if="editingPayment?.id === p.id">
                  <form class="flex items-center gap-2" @submit.prevent="savePayment">
                    <input
                      v-model.number="editingPayment.amount"
                      type="number"
                      min="1"
                      required
                      class="w-32 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
                    />
                    <input
                      v-model="editingPayment.payment_date"
                      type="date"
                      required
                      class="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      :disabled="saving"
                      class="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      class="rounded bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-600 transition"
                      @click="editingPayment = null"
                    >
                      Cancelar
                    </button>
                  </form>
                </template>
                <template v-else>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-semibold text-emerald-400">{{ formatCOP(p.amount) }}</p>
                      <p class="text-xs text-gray-500">{{ formatDate(p.payment_date) }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        class="rounded-md bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                        title="Editar"
                        @click="startEditPayment(p)"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        class="rounded-md bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                        title="Eliminar"
                        @click="askDeletePayment(p)"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirmación de borrado -->
    <ConfirmModal
      :visible="deleteTarget !== null"
      title="Eliminar registro"
      :message="`¿Seguro que quieres eliminar ${deleteTarget?.label ?? ''}? Esta acción no se puede deshacer.`"
      :loading="deleting"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
