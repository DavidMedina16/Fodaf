<script setup lang="ts">
import type { ActivityStatus, MemberRole } from '~~/types/database'

interface ProfileOption {
  id: string
  full_name: string
}

interface TeamMemberRow {
  role_title: string | null
  profiles: {
    id: string
    full_name: string
  }
}

interface TeamWithMembers {
  id: string
  name: string
  term: string
  team_members: TeamMemberRow[]
}

interface SelectedMember {
  profile_id: string
  role_title: string
}

interface ActivityRow {
  id: string
  name: string
  activity_date: string
  start_at: string | null
  status: ActivityStatus
  finished_at: string | null
  team_id: string | null
  teams: {
    name: string
    team_members: { profile_id: string }[]
  } | null
  // Filas hijas para derivar los totales financieros en tiempo real.
  activity_expenses: { amount: number }[]
  activity_products: { cost_price: number; stock_quantity: number }[]
  activity_sales: { total_price: number }[]
}

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()

// Reloj global: refresca `effectiveStatusOf` cada 30s para que
// una actividad `scheduled` pase a "En curso" en vivo al llegar
// su hora, sin recargar.
const nowMs = useGlobalClock()

// Usuario actual
const currentUserId = ref<string | null>(null)
const currentUserRole = ref<MemberRole | null>(null)
const isAdmin = computed(() => currentUserRole.value === 'admin')

const members = ref<ProfileOption[]>([])
const teams = ref<TeamWithMembers[]>([])
const activities = ref<ActivityRow[]>([])
const loading = ref(true)

// Form comité (admin)
const teamName = ref('')
const teamTerm = ref('')
const selectedMembers = ref<SelectedMember[]>([])
const creatingTeam = ref(false)

// Form actividad (admin)
const activityName = ref('')
const { toLocalDate, toLocalDatetime, toISOWithOffset } = useLocalDate()
const activityDate = ref(toLocalDate())
const activityStartAt = ref(toLocalDatetime())
const activityTeamId = ref('')
const creatingActivity = ref(false)

// Edición (admin)
interface EditingTeam {
  id: string
  name: string
  term: string
  members: SelectedMember[]
}
const editingTeam = ref<EditingTeam | null>(null)

interface EditingActivity {
  id: string
  name: string
  activity_date: string
  /** Valor para el input datetime-local (`YYYY-MM-DDTHH:mm`). */
  start_at_local: string
  team_id: string | null
}
const editingActivity = ref<EditingActivity | null>(null)
const saving = ref(false)

// Borrado (admin)
const deleteTarget = ref<{ kind: 'team' | 'activity'; id: string; label: string } | null>(null)
const deleting = ref(false)

async function loadCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  currentUserId.value = user.id

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data) currentUserRole.value = (data as { role: MemberRole }).role
}

async function loadData() {
  // El listado siempre trae las filas hijas: para admin / comité se
  // muestran los totales; para el resto, las actividades `finished`
  // también muestran sus totales (transparencia post-cierre).
  const [membersResult, teamsResult, activitiesResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase
      .from('teams')
      .select('id, name, term, team_members(role_title, profiles(id, full_name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('activities')
      .select('id, name, activity_date, start_at, status, finished_at, team_id, teams(name, team_members(profile_id)), activity_expenses(amount), activity_products(cost_price, stock_quantity), activity_sales(total_price)')
      .order('activity_date', { ascending: false }),
  ])

  members.value = (membersResult.data as unknown as ProfileOption[]) ?? []
  teams.value = (teamsResult.data as unknown as TeamWithMembers[]) ?? []
  activities.value = (activitiesResult.data as unknown as ActivityRow[]) ?? []
  loading.value = false
}

// ---- Permisos por fila ----

// El usuario actual es miembro del comité asignado a la actividad.
function isMemberOfCommittee(a: ActivityRow): boolean {
  const id = currentUserId.value
  if (!id) return false
  return a.teams?.team_members.some(tm => tm.profile_id === id) ?? false
}

// Estado efectivo: rebaja `scheduled` a `in_progress` si la hora
// ya pasó. Espejo de `effective_activity_status()` en SQL.
function effectiveStatusOf(a: ActivityRow): ActivityStatus {
  return effectiveActivityStatus(a.status, a.start_at, nowMs.value) ?? a.status
}

// Puede entrar al detalle: si está finalizada, todos; si está
// `scheduled` o `in_progress`, solo admin o comité.
function canViewDetail(a: ActivityRow): boolean {
  if (effectiveStatusOf(a) === 'finished') return true
  return isAdmin.value || isMemberOfCommittee(a)
}

// Muestra los totales financieros: el usuario tiene visibilidad
// sobre la actividad. Coincide con `canViewDetail` (única regla).
function canSeeNumbers(a: ActivityRow): boolean {
  return canViewDetail(a)
}

// ---- Totales financieros derivados (única fuente de la verdad) ----
function costsOf(a: ActivityRow): number {
  const expenses = a.activity_expenses.reduce((sum, e) => sum + e.amount, 0)
  const inventory = a.activity_products.reduce(
    (sum, p) => sum + p.cost_price * p.stock_quantity,
    0,
  )
  return expenses + inventory
}

function grossOf(a: ActivityRow): number {
  return a.activity_sales.reduce((sum, s) => sum + s.total_price, 0)
}

function netOf(a: ActivityRow): number {
  return grossOf(a) - costsOf(a)
}

// Total para el admin: suma de ganancias de actividades finalizadas.
// (Las en curso pueden tener números aún en movimiento.)
const totalProfits = computed(() =>
  activities.value
    .filter(a => a.status === 'finished')
    .reduce((sum, a) => sum + netOf(a), 0),
)

// ---- Crear comité (admin) ----
async function createTeam() {
  if (!teamName.value.trim() || !teamTerm.value.trim()) return

  creatingTeam.value = true

  const { data: newTeam, error } = await supabase
    .from('teams')
    .insert({ name: teamName.value.trim(), term: teamTerm.value.trim() })
    .select('id')
    .single()

  if (error || !newTeam) {
    toast.error('Error al crear el comité.')
    creatingTeam.value = false
    return
  }

  if (selectedMembers.value.length > 0) {
    const rows = selectedMembers.value.map(m => ({
      team_id: newTeam.id,
      profile_id: m.profile_id,
      role_title: m.role_title.trim() || null,
    }))

    const { error: membersError } = await supabase.from('team_members').insert(rows)

    if (membersError) {
      toast.error('Comité creado, pero hubo un error al asignar miembros.')
      creatingTeam.value = false
      await loadData()
      return
    }
  }

  creatingTeam.value = false
  toast.success('Comité creado correctamente.')
  teamName.value = ''
  teamTerm.value = ''
  selectedMembers.value = []
  await loadData()
}

async function createActivity() {
  if (!activityName.value.trim() || !activityDate.value || !activityStartAt.value) return

  creatingActivity.value = true

  // El estado inicial depende de la hora de inicio: si todavía no
  // llega, nace `scheduled`; si ya pasó, arranca `in_progress`.
  const startIso = toISOWithOffset(activityStartAt.value)
  const initialStatus = Date.parse(startIso) > Date.now() ? 'scheduled' : 'in_progress'

  const { error } = await supabase.from('activities').insert({
    name: activityName.value.trim(),
    activity_date: activityDate.value,
    start_at: startIso,
    status: initialStatus,
    team_id: activityTeamId.value || null,
  })

  creatingActivity.value = false

  if (error) {
    toast.error('Error al registrar la actividad.')
    return
  }

  toast.success('Actividad registrada correctamente.')
  activityName.value = ''
  activityDate.value = toLocalDate()
  activityStartAt.value = toLocalDatetime()
  activityTeamId.value = ''
  await loadData()
}

function toggleMember(id: string) {
  const idx = selectedMembers.value.findIndex(m => m.profile_id === id)
  if (idx >= 0) selectedMembers.value.splice(idx, 1)
  else selectedMembers.value.push({ profile_id: id, role_title: '' })
}

function isSelected(id: string): boolean {
  return selectedMembers.value.some(m => m.profile_id === id)
}

function findMemberName(id: string): string {
  return members.value.find(m => m.id === id)?.full_name ?? ''
}

function openEditTeam(team: TeamWithMembers) {
  editingTeam.value = {
    id: team.id,
    name: team.name,
    term: team.term,
    members: team.team_members.map(tm => ({
      profile_id: tm.profiles.id,
      role_title: tm.role_title ?? '',
    })),
  }
}

function toggleEditMember(id: string) {
  if (!editingTeam.value) return
  const idx = editingTeam.value.members.findIndex(m => m.profile_id === id)
  if (idx >= 0) editingTeam.value.members.splice(idx, 1)
  else editingTeam.value.members.push({ profile_id: id, role_title: '' })
}

function isEditSelected(id: string): boolean {
  return editingTeam.value?.members.some(m => m.profile_id === id) ?? false
}

async function saveTeamEdit() {
  if (!editingTeam.value) return
  saving.value = true
  const t = editingTeam.value

  const { error: updateError } = await supabase
    .from('teams')
    .update({ name: t.name, term: t.term })
    .eq('id', t.id)

  if (updateError) {
    saving.value = false
    toast.error('Error al actualizar el comité.')
    return
  }

  // Re-sincronizar miembros: borrar todos los existentes y re-insertar.
  const { error: delError } = await supabase.from('team_members').delete().eq('team_id', t.id)
  if (delError) {
    saving.value = false
    toast.error('Error al sincronizar miembros.')
    return
  }

  if (t.members.length > 0) {
    const rows = t.members.map(m => ({
      team_id: t.id,
      profile_id: m.profile_id,
      role_title: m.role_title.trim() || null,
    }))
    const { error: insError } = await supabase.from('team_members').insert(rows)
    if (insError) {
      saving.value = false
      toast.error('Error al asignar miembros.')
      return
    }
  }

  saving.value = false
  toast.success('Comité actualizado.')
  editingTeam.value = null
  await loadData()
}

function openEditActivity(a: ActivityRow) {
  editingActivity.value = {
    id: a.id,
    name: a.name,
    activity_date: a.activity_date,
    // Si la actividad no tenía hora (pre-migración), pre-llenamos
    // con el inicio del día activo para no enviar string vacío.
    start_at_local: a.start_at
      ? toLocalDatetime(new Date(a.start_at))
      : toLocalDatetime(new Date(a.activity_date + 'T08:00:00')),
    team_id: a.team_id,
  }
}

async function saveActivityEdit() {
  if (!editingActivity.value) return
  if (!editingActivity.value.start_at_local) return

  saving.value = true
  const a = editingActivity.value
  const { error } = await supabase
    .from('activities')
    .update({
      name: a.name,
      activity_date: a.activity_date,
      start_at: toISOWithOffset(a.start_at_local),
      team_id: a.team_id || null,
    })
    .eq('id', a.id)
  saving.value = false
  if (error) {
    toast.error('Error al guardar la actividad.')
    return
  }
  toast.success('Actividad actualizada.')
  editingActivity.value = null
  await loadData()
}

function askDeleteTeam(team: TeamWithMembers) {
  deleteTarget.value = { kind: 'team', id: team.id, label: `el comité "${team.name}"` }
}

function askDeleteActivity(a: ActivityRow) {
  deleteTarget.value = { kind: 'activity', id: a.id, label: `la actividad "${a.name}"` }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const table = deleteTarget.value.kind === 'team' ? 'teams' : 'activities'
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

onMounted(async () => {
  await loadCurrentUser()
  await loadData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Actividades</h1>
      <p class="text-gray-400 mt-1">
        <template v-if="isAdmin">Gestión de comités organizadores y actividades del fondo.</template>
        <template v-else>Selecciona una actividad para ver sus detalles o registrar ventas.</template>
      </p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse bg-gray-900 rounded-2xl h-48 border border-gray-800" />
      <div class="animate-pulse bg-gray-900 rounded-2xl h-48 border border-gray-800" />
    </div>

    <template v-else>
      <!-- ==================== COMITÉS (solo admin) ==================== -->
      <div v-if="isAdmin" class="mb-10">
        <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Comités</h2>

        <!-- Form nuevo comité -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <h3 class="text-sm font-medium text-white mb-4">Nuevo Comité</h3>
          <form @submit.prevent="createTeam" class="space-y-4">
            <div class="flex gap-4">
              <div class="flex-1">
                <label for="team-name" class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  id="team-name"
                  v-model="teamName"
                  type="text"
                  required
                  placeholder="Comité de Eventos"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              <div class="w-48">
                <label for="team-term" class="block text-sm font-medium text-gray-300 mb-1">Período</label>
                <input
                  id="team-term"
                  v-model="teamTerm"
                  type="text"
                  required
                  placeholder="2026"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-300 mb-2">Integrantes</p>
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="member in members"
                  :key="member.id"
                  type="button"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
                  :class="isSelected(member.id)
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'"
                  @click="toggleMember(member.id)"
                >
                  {{ member.full_name }}
                </button>
              </div>

              <div v-if="selectedMembers.length > 0" class="space-y-2 pt-3 border-t border-gray-800">
                <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Cargos</p>
                <div
                  v-for="selected in selectedMembers"
                  :key="selected.profile_id"
                  class="flex items-center gap-3"
                >
                  <span class="text-sm text-gray-300 flex-1 truncate">{{ findMemberName(selected.profile_id) }}</span>
                  <input
                    v-model="selected.role_title"
                    type="text"
                    placeholder="Cargo (ej. Tesorero)"
                    class="w-56 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              :disabled="creatingTeam"
              class="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ creatingTeam ? 'Creando...' : 'Crear Comité' }}
            </button>
          </form>
        </div>

        <!-- Lista de comités -->
        <div v-if="teams.length === 0" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
          <p class="text-gray-400">No hay comités registrados.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="team in teams"
            :key="team.id"
            class="bg-gray-900 rounded-2xl border border-gray-800 p-5"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-semibold text-white">{{ team.name }}</h3>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                  {{ team.term }}
                </span>
                <button
                  class="rounded-md bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                  title="Editar"
                  @click="openEditTeam(team)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  class="rounded-md bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                  title="Eliminar"
                  @click="askDeleteTeam(team)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="team.team_members.length > 0" class="flex flex-wrap gap-1.5">
              <span
                v-for="(tm, i) in team.team_members"
                :key="i"
                class="px-2.5 py-1 text-xs rounded-full bg-gray-800 text-gray-300"
              >
                {{ tm.profiles.full_name }}<span v-if="tm.role_title" class="text-emerald-400"> · {{ tm.role_title }}</span>
              </span>
            </div>
            <p v-else class="text-xs text-gray-500">Sin integrantes asignados.</p>
          </div>
        </div>
      </div>

      <!-- ==================== ACTIVIDADES ==================== -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider">
            <template v-if="isAdmin">Actividades</template>
            <template v-else>Listado</template>
          </h2>
          <div v-if="isAdmin && activities.length > 0" class="text-right">
            <p class="text-xs text-gray-400">Ganancia total (finalizadas)</p>
            <p class="text-lg font-bold text-emerald-400">{{ formatCOP(totalProfits) }}</p>
          </div>
        </div>

        <!-- Form nueva actividad (admin) -->
        <div v-if="isAdmin" class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <h3 class="text-sm font-medium text-white mb-4">Nueva Actividad</h3>
          <form @submit.prevent="createActivity" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-3">
                <label for="activity-name" class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  id="activity-name"
                  v-model="activityName"
                  type="text"
                  required
                  placeholder="Bingo familiar, rifa..."
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label for="activity-date" class="block text-sm font-medium text-gray-300 mb-1">Fecha del evento</label>
                <input
                  id="activity-date"
                  v-model="activityDate"
                  type="date"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="activity-start" class="block text-sm font-medium text-gray-300 mb-1">
                  Hora de inicio
                </label>
                <input
                  id="activity-start"
                  v-model="activityStartAt"
                  type="datetime-local"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
                <p class="text-xs text-gray-500 mt-1">
                  La actividad queda <span class="text-blue-400">"Programada"</span> hasta este momento, luego pasa automáticamente a <span class="text-yellow-400">"En curso"</span>.
                </p>
              </div>
            </div>

            <div>
              <label for="activity-team" class="block text-sm font-medium text-gray-300 mb-1">Comité Responsable</label>
              <select
                id="activity-team"
                v-model="activityTeamId"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              >
                <option value="">Sin comité</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ team.name }} ({{ team.term }})
                </option>
              </select>
            </div>
            <p class="text-xs text-gray-500">
              Los costos y la ganancia se calculan automáticamente desde los gastos, el inventario y las ventas registradas en el detalle de la actividad.
            </p>

            <button
              type="submit"
              :disabled="creatingActivity"
              class="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ creatingActivity ? 'Registrando...' : 'Registrar Actividad' }}
            </button>
          </form>
        </div>

        <!-- Lista de actividades -->
        <div v-if="activities.length === 0" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
          <p class="text-gray-400">No hay actividades registradas.</p>
        </div>
        <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-800">
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Actividad</th>
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Fecha</th>
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Comité</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Costos</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Ingresos</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Ganancia</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="activity in activities"
                :key="activity.id"
                class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <NuxtLink
                      v-if="canViewDetail(activity)"
                      :to="`/actividades/${activity.id}`"
                      class="text-sm font-medium text-white hover:text-emerald-400 transition"
                    >
                      {{ activity.name }}
                    </NuxtLink>
                    <span v-else class="text-sm font-medium text-gray-400">{{ activity.name }}</span>
                    <span
                      v-if="effectiveStatusOf(activity) === 'scheduled'"
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-wider"
                    >
                      Programada
                    </span>
                    <span
                      v-else-if="effectiveStatusOf(activity) === 'in_progress'"
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-500/20 text-yellow-400 uppercase tracking-wider"
                    >
                      En curso
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider"
                    >
                      Finalizada
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span v-if="activity.start_at" class="text-sm text-gray-300">{{ formatDatetime(activity.start_at) }}</span>
                  <span v-else class="text-sm text-gray-300">{{ formatDate(activity.activity_date) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-300">{{ activity.teams?.name ?? '—' }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span v-if="canSeeNumbers(activity)" class="text-sm text-gray-400">{{ formatCOP(costsOf(activity)) }}</span>
                  <span v-else class="text-sm text-gray-600">—</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span v-if="canSeeNumbers(activity)" class="text-sm text-gray-300">{{ formatCOP(grossOf(activity)) }}</span>
                  <span v-else class="text-sm text-gray-600">—</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span
                    v-if="canSeeNumbers(activity)"
                    class="text-sm font-semibold"
                    :class="netOf(activity) >= 0 ? 'text-emerald-400' : 'text-red-400'"
                  >
                    {{ formatCOP(netOf(activity)) }}
                  </span>
                  <span v-else class="text-sm text-gray-600">—</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <NuxtLink
                      v-if="canViewDetail(activity)"
                      :to="`/actividades/${activity.id}`"
                      class="rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1"
                      title="Abrir detalle de la actividad"
                    >
                      Detalle
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </NuxtLink>
                    <span
                      v-else
                      class="rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-gray-500"
                      title="Disponible cuando el comité finalice la actividad"
                    >
                      Disponible al finalizar
                    </span>
                    <template v-if="isAdmin">
                      <button
                        class="rounded-md bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                        title="Editar"
                        @click="openEditActivity(activity)"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        class="rounded-md bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                        title="Eliminar"
                        @click="askDeleteActivity(activity)"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal editar comité -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingTeam" class="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8">
          <div class="absolute inset-0 bg-black/60" @click="editingTeam = null" />
          <div class="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Comité</h2>
            <form class="space-y-4" @submit.prevent="saveTeamEdit">
              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                  <input
                    v-model="editingTeam.name"
                    type="text"
                    required
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div class="w-32">
                  <label class="block text-sm font-medium text-gray-300 mb-1">Período</label>
                  <input
                    v-model="editingTeam.term"
                    type="text"
                    required
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-300 mb-2">Integrantes</p>
                <div class="flex flex-wrap gap-2 mb-3">
                  <button
                    v-for="member in members"
                    :key="member.id"
                    type="button"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
                    :class="isEditSelected(member.id)
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'"
                    @click="toggleEditMember(member.id)"
                  >
                    {{ member.full_name }}
                  </button>
                </div>
                <div v-if="editingTeam.members.length > 0" class="space-y-2 pt-3 border-t border-gray-800">
                  <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Cargos</p>
                  <div
                    v-for="selected in editingTeam.members"
                    :key="selected.profile_id"
                    class="flex items-center gap-3"
                  >
                    <span class="text-sm text-gray-300 flex-1 truncate">{{ findMemberName(selected.profile_id) }}</span>
                    <input
                      v-model="selected.role_title"
                      type="text"
                      placeholder="Cargo"
                      class="w-56 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="editingTeam = null"
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

    <!-- Modal editar actividad -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingActivity" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="editingActivity = null" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Actividad</h2>
            <form class="space-y-4" @submit.prevent="saveActivityEdit">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  v-model="editingActivity.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Fecha del evento</label>
                <input
                  v-model="editingActivity.activity_date"
                  type="date"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Hora de inicio</label>
                <input
                  v-model="editingActivity.start_at_local"
                  type="datetime-local"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Editar la hora no cambia el estado actual de la actividad.
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Comité</label>
                <select
                  v-model="editingActivity.team_id"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option :value="null">Sin comité</option>
                  <option v-for="team in teams" :key="team.id" :value="team.id">
                    {{ team.name }} ({{ team.term }})
                  </option>
                </select>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="editingActivity = null"
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
