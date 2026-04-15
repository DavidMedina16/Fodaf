<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  availableSavings: number
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabase()
const toast = useToast()

const amount = ref<number | null>(null)
const submitting = ref(false)

const exceedsAvailable = computed(() =>
  amount.value !== null && amount.value > props.availableSavings,
)

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

async function handleSubmit() {
  if (!amount.value || amount.value <= 0) return

  if (amount.value > props.availableSavings) {
    toast.error(`El monto supera tu ahorro disponible (${formatCOP(props.availableSavings)}).`)
    return
  }

  submitting.value = true

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    submitting.value = false
    return
  }

  const { error } = await supabase.from('withdrawals').insert({
    profile_id: user.id,
    amount: amount.value,
    status: 'pending',
  })

  submitting.value = false

  if (error) {
    toast.error('Error al registrar el retiro. Intenta de nuevo.')
    return
  }

  toast.success('Solicitud de retiro enviada. En espera de aprobación del administrador.')
  amount.value = null
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
        <div
          class="absolute inset-0 bg-black/60"
          @click="emit('close')"
        />

        <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Solicitar Retiro</h2>
            <button
              class="text-gray-500 hover:text-white transition"
              @click="emit('close')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div class="mb-5 rounded-lg bg-gray-800/50 px-4 py-3">
            <p class="text-xs text-gray-400 uppercase tracking-wider">Ahorro disponible</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ formatCOP(availableSavings) }}</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div>
              <label for="withdrawal-amount" class="block text-sm font-medium text-gray-300 mb-1">
                Monto a retirar (COP)
              </label>
              <input
                id="withdrawal-amount"
                v-model.number="amount"
                type="number"
                required
                min="1"
                :max="availableSavings"
                step="1"
                placeholder="50000"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
              <p
                v-if="exceedsAvailable"
                class="text-xs text-red-400 mt-1"
              >
                El monto supera tu ahorro disponible.
              </p>
            </div>

            <button
              type="submit"
              :disabled="submitting || exceedsAvailable || !amount"
              class="w-full rounded-lg bg-emerald-600 py-2.5 text-white font-semibold hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? 'Enviando...' : 'Enviar Solicitud' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
