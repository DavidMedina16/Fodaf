<script setup lang="ts">
interface PenaltyRow {
  id: string
  profile_id: string
  amount: number
  reason: 'absence' | 'late_arrival' | 'other'
  status: 'pending' | 'paid' | 'deducted_from_savings'
  profiles: {
    full_name: string
  }
}

interface Meeting {
  id: string
  topic: string
  meeting_date: string
  created_at: string
  penalties: PenaltyRow[]
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

// Edición inline
const editingMeeting = ref<Meeting | null>(null)
const editingPenalty = ref<(PenaltyRow & { meeting_id: string }) | null>(null)
const saving = ref(false)

// Borrado
const deleteTarget = ref<{ kind: 'meeting' | 'penalty'; id: string; label: string } | null>(null)
const deleting = ref(false)

async function loadData() {
  const [meetingsResult, membersResult] = await Promise.all([
    supabase
      .from('meetings')
      .select('id, topic, meeting_date, created_at, penalties(id, profile_id, amount, reason, status, profiles(full_name))')
      .order('meeting_date', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name'),
  ])

  meetings.value = (meetingsResult.data as unknown as Meeting[]) ?? []
  members.value = (membersResult.data as unknown as ProfileOption[]) ?? []
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

function openEditMeeting(m: Meeting) {
  editingMeeting.value = {
    ...m,
    meeting_date: toLocalDatetime(new Date(m.meeting_date)),
  }
}

async function saveMeeting() {
  if (!editingMeeting.value) return
  saving.value = true
  const { error } = await supabase
    .from('meetings')
    .update({
      topic: editingMeeting.value.topic,
      meeting_date: editingMeeting.value.meeting_date,
    })
    .eq('id', editingMeeting.value.id)
  saving.value = false
  if (error) {
    toast.error('Error al guardar la reunión.')
    return
  }
  toast.success('Reunión actualizada.')
  editingMeeting.value = null
  await loadData()
}

function openEditPenalty(p: PenaltyRow, meetingId: string) {
  editingPenalty.value = { ...p, meeting_id: meetingId }
}

async function savePenalty() {
  if (!editingPenalty.value) return
  saving.value = true
  const p = editingPenalty.value
  const { error } = await supabase
    .from('penalties')
    .update({
      profile_id: p.profile_id,
      amount: p.amount,
      reason: p.reason,
      status: p.status,
    })
    .eq('id', p.id)
  saving.value = false
  if (error) {
    toast.error('Error al guardar la multa.')
    return
  }
  toast.success('Multa actualizada.')
  editingPenalty.value = null
  await loadData()
}

function askDeleteMeeting(m: Meeting) {
  deleteTarget.value = { kind: 'meeting', id: m.id, label: `la reunión "${m.topic}"` }
}

function askDeletePenalty(p: PenaltyRow) {
  deleteTarget.value = {
    kind: 'penalty',
    id: p.id,
    label: `la multa de ${p.profiles.full_name} (${formatCOP(p.amount)})`,
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const table = deleteTarget.value.kind === 'meeting' ? 'meetings' : 'penalties'
  const { error } = await supabase.from(table).delete().eq('id', deleteTarget.value.id)
  deleting.value = false
  if (error) {
    toast.error(`No se pudo eliminar: ${error.message}`)
    return
  }
  toast.success('Registro eliminado.')
  deleteTarget.value = null
  await loadData()
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
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
              @click="openPenaltyModal(meeting.id)"
            >
              + Registrar Multa
            </button>
            <button
              class="rounded-lg bg-gray-700 p-2 text-gray-300 hover:bg-gray-600 hover:text-white transition"
              title="Editar reunión"
              @click="openEditMeeting(meeting)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button
              class="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition"
              title="Eliminar reunión"
              @click="askDeleteMeeting(meeting)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
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
              <div class="flex items-center gap-2">
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
                <button
                  class="rounded-md bg-gray-700 p-1 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                  title="Editar multa"
                  @click="openEditPenalty(penalty, meeting.id)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  class="rounded-md bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20 transition"
                  title="Eliminar multa"
                  @click="askDeletePenalty(penalty)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
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

    <!-- Modal editar reunión -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingMeeting" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="editingMeeting = null" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Reunión</h2>
            <form class="space-y-4" @submit.prevent="saveMeeting">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Tema</label>
                <input
                  v-model="editingMeeting.topic"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Fecha y hora</label>
                <input
                  v-model="editingMeeting.meeting_date"
                  type="datetime-local"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="editingMeeting = null"
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

    <!-- Modal editar multa -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingPenalty" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="editingPenalty = null" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Multa</h2>
            <form class="space-y-4" @submit.prevent="savePenalty">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Miembro</label>
                <select
                  v-model="editingPenalty.profile_id"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option v-for="m in members" :key="m.id" :value="m.id">{{ m.full_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Motivo</label>
                <select
                  v-model="editingPenalty.reason"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="absence">Inasistencia</option>
                  <option value="late_arrival">Llegada tarde</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Monto (COP)</label>
                <input
                  v-model.number="editingPenalty.amount"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <select
                  v-model="editingPenalty.status"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagada</option>
                  <option value="deducted_from_savings">Descontada</option>
                </select>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="editingPenalty = null"
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
