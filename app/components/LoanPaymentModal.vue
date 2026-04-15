<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  loanId: string
  remainingBalance: number
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabase()
const toast = useToast()

const amount = ref<number | null>(null)
const { toLocalDate } = useLocalDate()
const paymentDate = ref(toLocalDate())
const submitting = ref(false)

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

async function handleSubmit() {
  if (!amount.value || amount.value <= 0) return

  submitting.value = true

  // 1. Insertar el pago
  const { error: insertError } = await supabase.from('loan_payments').insert({
    loan_id: props.loanId,
    amount: amount.value,
    payment_date: paymentDate.value,
  })

  if (insertError) {
    toast.error('Error al registrar el pago. Intenta de nuevo.')
    submitting.value = false
    return
  }

  // 2. Verificar si el préstamo se pagó completamente
  const { data: loan } = await supabase
    .from('loans')
    .select('requested_amount, interest_rate')
    .eq('id', props.loanId)
    .single()

  const { data: payments } = await supabase
    .from('loan_payments')
    .select('amount')
    .eq('loan_id', props.loanId)

  if (loan && payments) {
    const totalDue = Math.round(loan.requested_amount * (1 + loan.interest_rate / 100))
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    if (totalPaid >= totalDue) {
      await supabase
        .from('loans')
        .update({ status: 'paid' })
        .eq('id', props.loanId)

      toast.success('Préstamo pagado en su totalidad.')
    } else {
      toast.success('Pago registrado correctamente.')
    }
  } else {
    toast.success('Pago registrado correctamente.')
  }

  submitting.value = false
  amount.value = null
  paymentDate.value = toLocalDate()
  emit('saved')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60"
          @click="emit('close')"
        />

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Abonar a la Deuda</h2>
            <button
              class="text-gray-500 hover:text-white transition"
              @click="emit('close')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Saldo info -->
          <div class="rounded-lg bg-gray-800/50 px-4 py-3 mb-5">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">Saldo pendiente</span>
              <span class="text-sm font-semibold text-white">{{ formatCOP(remainingBalance) }}</span>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Monto -->
            <div>
              <label for="payment-amount" class="block text-sm font-medium text-gray-300 mb-1">
                Monto a abonar (COP)
              </label>
              <input
                id="payment-amount"
                v-model.number="amount"
                type="number"
                required
                min="1"
                :max="remainingBalance"
                placeholder="50000"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <!-- Fecha -->
            <div>
              <label for="payment-date" class="block text-sm font-medium text-gray-300 mb-1">
                Fecha de pago
              </label>
              <input
                id="payment-date"
                v-model="paymentDate"
                type="date"
                required
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="submitting"
              class="w-full rounded-lg bg-emerald-600 py-2.5 text-white font-semibold hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? 'Registrando...' : 'Registrar Pago' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
