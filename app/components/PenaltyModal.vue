<script setup lang="ts">
interface ProfileOption {
  id: string
  full_name: string
}

const props = defineProps<{
  visible: boolean
  meetingId: string
  members: ProfileOption[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabase()
const toast = useToast()

const profileId = ref('')
const reason = ref<'absence' | 'late_arrival' | 'other'>('absence')
const amount = ref(30000)
const submitting = ref(false)

watch(reason, (val) => {
  if (val === 'absence') amount.value = 30000
  else if (val === 'late_arrival') amount.value = 10000
  else amount.value = 0
})

const reasonLabel: Record<string, string> = {
  absence: 'Inasistencia — $30.000',
  late_arrival: 'Llegada tarde (15+ min) — $10.000',
  other: 'Otro motivo',
}

const isAmountReadonly = computed(() => reason.value !== 'other')

async function handleSubmit() {
  if (!profileId.value || !amount.value || amount.value <= 0) return

  submitting.value = true

  const { error } = await supabase.from('penalties').insert({
    profile_id: profileId.value,
    meeting_id: props.meetingId,
    reason: reason.value,
    amount: amount.value,
    status: 'pending',
  })

  submitting.value = false

  if (error) {
    toast.error('Error al registrar la multa.')
    return
  }

  toast.success('Multa registrada correctamente.')
  profileId.value = ''
  reason.value = 'absence'
  amount.value = 30000
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
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Registrar Multa</h2>
            <button
              class="text-gray-500 hover:text-white transition"
              @click="emit('close')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Infractor -->
            <div>
              <label for="penalty-member" class="block text-sm font-medium text-gray-300 mb-1">
                Miembro
              </label>
              <select
                id="penalty-member"
                v-model="profileId"
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
            </div>

            <!-- Motivo -->
            <div>
              <label for="penalty-reason" class="block text-sm font-medium text-gray-300 mb-1">
                Motivo
              </label>
              <select
                id="penalty-reason"
                v-model="reason"
                required
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              >
                <option v-for="(label, key) in reasonLabel" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>

            <!-- Monto -->
            <div>
              <label for="penalty-amount" class="block text-sm font-medium text-gray-300 mb-1">
                Valor de la Multa (COP)
              </label>
              <input
                id="penalty-amount"
                v-model.number="amount"
                type="number"
                required
                min="1"
                :readonly="isAmountReadonly"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                :class="isAmountReadonly ? 'opacity-60 cursor-not-allowed' : ''"
              />
              <p v-if="isAmountReadonly" class="text-xs text-gray-500 mt-1">
                Monto definido por estatutos.
              </p>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="submitting"
              class="w-full rounded-lg bg-red-600 py-2.5 text-white font-semibold hover:bg-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? 'Registrando...' : 'Aplicar Multa' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
