<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabase()
const toast = useToast()
const { settings: fundSettings } = useFundSettings()

const amount = ref<number | null>(null)
const { toLocalDate } = useLocalDate()
const depositDate = ref(toLocalDate())
const submitting = ref(false)

async function handleSubmit() {
  if (!amount.value || amount.value < (fundSettings.value?.min_savings_minor ?? 100000)) return

  submitting.value = true

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('contributions').insert({
    profile_id: user.id,
    amount: amount.value,
    deposit_date: depositDate.value,
    status: 'pending',
  })

  submitting.value = false

  if (error) {
    toast.error('Error al registrar el aporte. Intenta de nuevo.')
    return
  }

  toast.success('Aporte registrado. En espera de aprobación del administrador.')
  amount.value = null
  depositDate.value = toLocalDate()
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
            <h2 class="text-xl font-bold text-white">Registrar Aporte</h2>
            <button
              class="text-gray-500 hover:text-white transition"
              @click="emit('close')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Monto -->
            <div>
              <label for="amount" class="block text-sm font-medium text-gray-300 mb-1">
                Monto (COP)
              </label>
              <input
                id="amount"
                v-model.number="amount"
                type="number"
                required
                :min="fundSettings?.min_savings_minor ?? 100000"
                step="1000"
                :placeholder="String(fundSettings?.min_savings_adult ?? 120000)"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
              <p class="text-xs text-gray-500 mt-1">
                Mínimo: {{ formatCOP(fundSettings?.min_savings_minor ?? 100000) }} (menores)
                / {{ formatCOP(fundSettings?.min_savings_adult ?? 120000) }} (mayores)
              </p>
            </div>

            <!-- Fecha -->
            <div>
              <label for="deposit-date" class="block text-sm font-medium text-gray-300 mb-1">
                Fecha de depósito
              </label>
              <input
                id="deposit-date"
                v-model="depositDate"
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
              {{ submitting ? 'Enviando...' : 'Enviar Aporte' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
