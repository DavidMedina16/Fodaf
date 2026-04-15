<script setup lang="ts">
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

interface Activity {
  id: string
  name: string
  activity_date: string
  team_id: string | null
  costs: number
  net_profits: number
  teams: {
    name: string
  } | null
}

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()

const members = ref<ProfileOption[]>([])
const teams = ref<TeamWithMembers[]>([])
const activities = ref<Activity[]>([])
const loading = ref(true)

// Form comité
const teamName = ref('')
const teamTerm = ref('')
const selectedMembers = ref<SelectedMember[]>([])
const creatingTeam = ref(false)

// Form actividad
const activityName = ref('')
const { toLocalDate } = useLocalDate()
const activityDate = ref(toLocalDate())
const activityTeamId = ref('')
const activityCosts = ref<number | null>(null)
const activityProfits = ref<number | null>(null)
const creatingActivity = ref(false)

// Edición
interface EditingTeam {
  id: string
  name: string
  term: string
  members: SelectedMember[]
}
const editingTeam = ref<EditingTeam | null>(null)
const editingActivity = ref<Activity | null>(null)
const saving = ref(false)

// Borrado
const deleteTarget = ref<{ kind: 'team' | 'activity'; id: string; label: string } | null>(null)
const deleting = ref(false)

async function loadData() {
  const [membersResult, teamsResult, activitiesResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name'),
    supabase
      .from('teams')
      .select('id, name, term, team_members(role_title, profiles(id, full_name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('activities')
      .select('id, name, activity_date, team_id, costs, net_profits, teams(name)')
      .order('activity_date', { ascending: false }),
  ])

  members.value = (membersResult.data as unknown as ProfileOption[]) ?? []
  teams.value = (teamsResult.data as unknown as TeamWithMembers[]) ?? []
  activities.value = (activitiesResult.data as unknown as Activity[]) ?? []
  loading.value = false
}

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
  if (!activityName.value.trim() || !activityDate.value) return

  creatingActivity.value = true

  const { error } = await supabase.from('activities').insert({
    name: activityName.value.trim(),
    activity_date: activityDate.value,
    team_id: activityTeamId.value || null,
    costs: activityCosts.value ?? 0,
    net_profits: activityProfits.value ?? 0,
  })

  creatingActivity.value = false

  if (error) {
    toast.error('Error al registrar la actividad.')
    return
  }

  toast.success('Actividad registrada correctamente.')
  activityName.value = ''
  activityDate.value = toLocalDate()
  activityTeamId.value = ''
  activityCosts.value = null
  activityProfits.value = null
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

  // Re-sincronizar miembros: borrar todos los existentes y re-insertar los actuales.
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

function openEditActivity(a: Activity) {
  editingActivity.value = { ...a }
}

async function saveActivityEdit() {
  if (!editingActivity.value) return
  saving.value = true
  const a = editingActivity.value
  const { error } = await supabase
    .from('activities')
    .update({
      name: a.name,
      activity_date: a.activity_date,
      team_id: a.team_id || null,
      costs: a.costs,
      net_profits: a.net_profits,
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

function askDeleteActivity(a: Activity) {
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

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const totalProfits = computed(() =>
  activities.value.reduce((sum, a) => sum + (a.net_profits ?? 0), 0),
)

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Comités y Actividades</h1>
      <p class="text-gray-400 mt-1">Gestión de comités organizadores y actividades del fondo.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse bg-gray-900 rounded-2xl h-48 border border-gray-800" />
      <div class="animate-pulse bg-gray-900 rounded-2xl h-48 border border-gray-800" />
    </div>

    <template v-else>
      <!-- ==================== COMITÉS ==================== -->
      <div class="mb-10">
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

            <!-- Selector de miembros -->
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

              <!-- Cargos de los seleccionados -->
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
          <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Actividades</h2>
          <div v-if="activities.length > 0" class="text-right">
            <p class="text-xs text-gray-400">Ganancia total</p>
            <p class="text-lg font-bold text-emerald-400">{{ formatCOP(totalProfits) }}</p>
          </div>
        </div>

        <!-- Form nueva actividad -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <h3 class="text-sm font-medium text-white mb-4">Nueva Actividad</h3>
          <form @submit.prevent="createActivity" class="space-y-4">
            <div class="flex gap-4">
              <div class="flex-1">
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
              <div class="w-48">
                <label for="activity-date" class="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
                <input
                  id="activity-date"
                  v-model="activityDate"
                  type="date"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-1">
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
              <div class="w-48">
                <label for="activity-costs" class="block text-sm font-medium text-gray-300 mb-1">Costos (COP)</label>
                <input
                  id="activity-costs"
                  v-model.number="activityCosts"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              <div class="w-48">
                <label for="activity-profits" class="block text-sm font-medium text-gray-300 mb-1">Ganancia Neta (COP)</label>
                <input
                  id="activity-profits"
                  v-model.number="activityProfits"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

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
        <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-800">
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Actividad</th>
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Fecha</th>
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Comité</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Costos</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Ganancia Neta</th>
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
                  <span class="text-sm font-medium text-white">{{ activity.name }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-300">{{ formatDate(activity.activity_date) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-300">{{ activity.teams?.name ?? '—' }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-400">{{ formatCOP(activity.costs) }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm font-semibold text-emerald-400">{{ formatCOP(activity.net_profits) }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
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
                <label class="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
                <input
                  v-model="editingActivity.activity_date"
                  type="date"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
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
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Costos (COP)</label>
                  <input
                    v-model.number="editingActivity.costs"
                    type="number"
                    min="0"
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Ganancia (COP)</label>
                  <input
                    v-model.number="editingActivity.net_profits"
                    type="number"
                    min="0"
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
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
