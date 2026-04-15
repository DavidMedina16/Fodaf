<script setup lang="ts">
interface Meeting {
  id: string
  topic: string
  meeting_date: string
  created_at: string
  penalties: {
    id: string
    amount: number
    reason: string
    status: string
    profiles: {
      full_name: string
    }
  }[]
}

interface ProfileOption {
  id: string
  full_name: string
}

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()
const { toLocalDatetime } = useLocalDate()

const meetings = ref<Meeting[]>([])
const members = ref<ProfileOption[]>([])
const loading = ref(true)

// Form nueva reunión
const newTopic = ref('')
const newDate = ref(toLocalDatetime(new Date()))
const creatingMeeting = ref(false)

// Modal multa
const penaltyModalVisible = ref(false)
const selectedMeetingId = ref('')
const processingPenaltyId = ref<string | null>(null)

async function loadData() {
  const [meetingsResult, membersResult] = await Promise.all([
    supabase
      .from('meetings')
      .select('id, topic, meeting_date, created_at, penalties(id, amount, reason, status, profiles(full_name))')
      .order('meeting_date', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name'),
  ])

  meetings.value = (meetingsResult.data as Meeting[]) ?? []
  members.value = (membersResult.data as ProfileOption[]) ?? []
  loading.value = false
}

async function createMeeting() {
  if (!newTopic.value.trim() || !newDate.value) return

  creatingMeeting.value = true

  const { error } = await supabase.from('meetings').insert({
    topic: newTopic.value.trim(),
    meeting_date: newDate.value,
  })

  creatingMeeting.value = false

  if (error) {
    toast.error('Error al crear la reunión.')
    return
  }

  toast.success('Reunión creada correctamente.')
  newTopic.value = ''
  newDate.value = toLocalDatetime(new Date())
  await loadData()
}

async function updatePenaltyStatus(id: string, status: 'paid' | 'deducted_from_savings') {
  processingPenaltyId.value = id

  const { error } = await supabase
    .from('penalties')
    .update({ status })
    .eq('id', id)

  processingPenaltyId.value = null

  if (error) {
    toast.error('Error al actualizar la multa.')
    return
  }

  const label = status === 'paid' ? 'Multa marcada como pagada.' : 'Multa descontada de ahorros.'
  toast.success(label)
  await loadData()
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  deducted_from_savings: 'Descontada',
}

function openPenaltyModal(meetingId: string) {
  selectedMeetingId.value = meetingId
  penaltyModalVisible.value = true
}

const reasonLabels: Record<string, string> = {
  absence: 'Inasistencia',
  late_arrival: 'Llegada tarde',
  other: 'Otro',
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Reuniones y Multas</h1>
      <p class="text-gray-400 mt-1">Registra reuniones y aplica sanciones según los estatutos.</p>
    </div>

    <!-- Formulario nueva reunión -->
    <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
      <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Nueva Reunión</h2>
      <form @submit.prevent="createMeeting" class="flex items-end gap-4">
        <div class="flex-1">
          <label for="topic" class="block text-sm font-medium text-gray-300 mb-1">Tema</label>
          <input
            id="topic"
            v-model="newTopic"
            type="text"
            required
            placeholder="Reunión mensual, asamblea..."
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>
        <div class="w-64">
          <label for="meeting-date" class="block text-sm font-medium text-gray-300 mb-1">Fecha y Hora</label>
          <input
            id="meeting-date"
            v-model="newDate"
            type="datetime-local"
            required
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>
        <button
          type="submit"
          :disabled="creatingMeeting"
          class="shrink-0 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ creatingMeeting ? 'Creando...' : 'Crear Reunión' }}
        </button>
      </form>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse bg-gray-900 rounded-2xl h-32 border border-gray-800"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="meetings.length === 0"
      class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
    >
      <p class="text-gray-400 text-lg">No hay reuniones registradas.</p>
    </div>

    <!-- Lista de reuniones -->
    <div v-else class="space-y-4">
      <div
        v-for="meeting in meetings"
        :key="meeting.id"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">{{ meeting.topic }}</h3>
            <p class="text-sm text-gray-400 mt-0.5">{{ formatDateTime(meeting.meeting_date) }}</p>
          </div>
          <button
            class="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
            @click="openPenaltyModal(meeting.id)"
          >
            + Registrar Multa
          </button>
        </div>

        <!-- Multas de esta reunión -->
        <div v-if="meeting.penalties.length > 0">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Multas aplicadas ({{ meeting.penalties.length }})
          </p>
          <div class="space-y-2">
            <div
              v-for="penalty in meeting.penalties"
              :key="penalty.id"
              class="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-2.5"
            >
              <div class="flex items-center gap-3">
                <span
                  class="h-2 w-2 rounded-full"
                  :class="penalty.status === 'pending' ? 'bg-red-400' : 'bg-gray-500'"
                />
                <span class="text-sm text-white">{{ penalty.profiles.full_name }}</span>
                <span class="text-xs text-gray-500">{{ reasonLabels[penalty.reason] ?? penalty.reason }}</span>
                <span
                  class="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                  :class="{
                    'bg-red-500/20 text-red-400': penalty.status === 'pending',
                    'bg-emerald-500/20 text-emerald-400': penalty.status === 'paid',
                    'bg-blue-500/20 text-blue-400': penalty.status === 'deducted_from_savings',
                  }"
                >
                  {{ statusLabels[penalty.status] ?? penalty.status }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm font-semibold text-red-400">{{ formatCOP(penalty.amount) }}</span>
                <template v-if="penalty.status === 'pending'">
                  <button
                    :disabled="processingPenaltyId === penalty.id"
                    class="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="updatePenaltyStatus(penalty.id, 'paid')"
                  >
                    Pagada
                  </button>
                  <button
                    :disabled="processingPenaltyId === penalty.id"
                    class="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="updatePenaltyStatus(penalty.id, 'deducted_from_savings')"
                  >
                    Descontar
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="text-sm text-gray-500">Sin multas registradas.</p>
      </div>
    </div>

    <!-- Modal de multa -->
    <PenaltyModal
      :visible="penaltyModalVisible"
      :meeting-id="selectedMeetingId"
      :members="members"
      @close="penaltyModalVisible = false"
      @saved="loadData"
    />
  </div>
</template>
