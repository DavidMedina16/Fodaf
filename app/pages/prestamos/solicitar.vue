<script setup lang="ts">
interface ProfileOption {
  id: string
  full_name: string
}

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const supabase = useSupabase()
const router = useRouter()
const toast = useToast()
const { settings: fundSettings, load: loadFundSettings } = useFundSettings()

const totalSavings = ref(0)
const members = ref<ProfileOption[]>([])
const loading = ref(true)
const submitting = ref(false)

const requestedAmount = ref<number | null>(null)
const interestRate = ref(2)
const installments = ref<number | null>(null)
const guarantorId = ref('')

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const [savingsResult, membersResult] = await Promise.all([
    supabase
      .from('contributions')
      .select('amount')
      .eq('profile_id', user.id)
      .eq('status', 'approved'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .neq('id', user.id),
    loadFundSettings(),
  ])

  totalSavings.value = savingsResult.data
    ? savingsResult.data.reduce((sum, c) => sum + c.amount, 0)
    : 0

  members.value = (membersResult.data as ProfileOption[]) ?? []
  interestRate.value = fundSettings.value?.min_interest_rate ?? 2
  loading.value = false
})

const maxWithoutGuarantor = computed(() => {
  if (!fundSettings.value) return 0
  const savingsCap = Math.floor(
    totalSavings.value * (fundSettings.value.loan_savings_percentage_cap / 100),
  )
  return Math.min(fundSettings.value.loan_limit_without_guarantor, savingsCap)
})

const requiresGuarantor = computed(() => {
  if (!requestedAmount.value) return false
  return requestedAmount.value > maxWithoutGuarantor.value
})

const totalDue = computed(() => {
  if (!requestedAmount.value || !interestRate.value) return 0
  return Math.round(requestedAmount.value * (1 + interestRate.value / 100))
})

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

async function handleSubmit() {
  if (!requestedAmount.value || requestedAmount.value <= 0) return
  if (interestRate.value < (fundSettings.value?.min_interest_rate ?? 2)) return
  if (!installments.value || installments.value < 1) return
  if (requiresGuarantor.value && !guarantorId.value) return

  submitting.value = true

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('loans').insert({
    profile_id: user.id,
    guarantor_id: requiresGuarantor.value ? guarantorId.value : null,
    requested_amount: requestedAmount.value,
    interest_rate: interestRate.value,
    installments: installments.value,
    status: 'pending',
  })

  submitting.value = false

  if (error) {
    toast.error('Error al enviar la solicitud. Intenta de nuevo.')
    return
  }

  toast.success('Solicitud enviada a revisión.')
  await router.push('/dashboard')
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/dashboard" class="text-sm text-gray-400 hover:text-white transition">
        &larr; Volver al Dashboard
      </NuxtLink>
      <h1 class="text-2xl font-bold text-white mt-4">Solicitar Préstamo</h1>
      <p class="text-gray-400 mt-1">Completa los datos para enviar tu solicitud.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="animate-pulse bg-gray-900 rounded-2xl h-96 border border-gray-800" />

    <template v-else>
      <!-- Info de ahorro -->
      <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">Tu ahorro aprobado</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ formatCOP(totalSavings) }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-400">Máximo sin codeudor</p>
            <p class="text-xl font-bold text-white mt-1">{{ formatCOP(maxWithoutGuarantor) }}</p>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <form
        class="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-6"
        @submit.prevent="handleSubmit"
      >
        <!-- Monto -->
        <div>
          <label for="amount" class="block text-sm font-medium text-gray-300 mb-1">
            Monto a Solicitar (COP)
          </label>
          <input
            id="amount"
            v-model.number="requestedAmount"
            type="number"
            required
            min="1"
            placeholder="200000"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <!-- Tasa de interés -->
        <div>
          <label for="interest" class="block text-sm font-medium text-gray-300 mb-1">
            Tasa de Interés (%)
          </label>
          <input
            id="interest"
            v-model.number="interestRate"
            type="number"
            required
            :min="fundSettings?.min_interest_rate ?? 2"
            step="0.5"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
          <p class="text-xs text-gray-500 mt-1">
            Mínimo {{ fundSettings?.min_interest_rate ?? 2 }}% según estatutos.
          </p>
        </div>

        <!-- Cuotas -->
        <div>
          <label for="installments" class="block text-sm font-medium text-gray-300 mb-1">
            Cantidad de Cuotas
          </label>
          <input
            id="installments"
            v-model.number="installments"
            type="number"
            required
            min="1"
            placeholder="3"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <!-- Resumen -->
        <div
          v-if="requestedAmount && requestedAmount > 0"
          class="rounded-lg bg-gray-800/50 px-4 py-3 space-y-1"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Total a pagar (capital + interés)</span>
            <span class="text-sm font-semibold text-white">{{ formatCOP(totalDue) }}</span>
          </div>
          <div v-if="installments && installments > 0" class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Cuota mensual aprox.</span>
            <span class="text-sm font-semibold text-white">{{ formatCOP(Math.round(totalDue / installments)) }}</span>
          </div>
        </div>

        <!-- Alerta codeudor -->
        <div
          v-if="requiresGuarantor"
          class="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-3"
        >
          <p class="text-sm text-yellow-400 font-medium">
            El monto solicitado supera el límite sin codeudor. Debes seleccionar un fiador.
          </p>
        </div>

        <!-- Select codeudor -->
        <div v-if="requiresGuarantor">
          <label for="guarantor" class="block text-sm font-medium text-gray-300 mb-1">
            Codeudor (Fiador)
          </label>
          <select
            id="guarantor"
            v-model="guarantorId"
            required
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          >
            <option value="" disabled>Selecciona un miembro</option>
            <option
              v-for="member in members"
              :key="member.id"
              :value="member.id"
            >
              {{ member.full_name }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-1">
            El codeudor debe ser miembro activo del fondo con capacidad suficiente.
          </p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-lg bg-emerald-600 py-2.5 text-white font-semibold hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? 'Enviando...' : 'Enviar Solicitud' }}
        </button>
      </form>
    </template>
  </div>
</template>
