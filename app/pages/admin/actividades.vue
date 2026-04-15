<script setup lang="ts">
interface ProfileOption {
  id: string
  full_name: string
}

interface TeamWithMembers {
  id: string
  name: string
  term: string
  team_members: {
    profiles: {
      full_name: string
    }
  }[]
}

interface Activity {
  id: string
  name: string
  activity_date: string
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
const selectedMembers = ref<string[]>([])
const creatingTeam = ref(false)

// Form actividad
const activityName = ref('')
const { toLocalDate } = useLocalDate()
const activityDate = ref(toLocalDate())
const activityTeamId = ref('')
const activityCosts = ref<number | null>(null)
const activityProfits = ref<number | null>(null)
const creatingActivity = ref(false)

async function loadData() {
  const [membersResult, teamsResult, activitiesResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name'),
    supabase
      .from('teams')
      .select('id, name, term, team_members(profiles(full_name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('activities')
      .select('id, name, activity_date, costs, net_profits, teams(name)')
      .order('activity_date', { ascending: false }),
  ])

  members.value = (membersResult.data as ProfileOption[]) ?? []
  teams.value = (teamsResult.data as TeamWithMembers[]) ?? []
  activities.value = (activitiesResult.data as Activity[]) ?? []
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
    const rows = selectedMembers.value.map(profileId => ({
      team_id: newTeam.id,
      profile_id: profileId,
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
  const idx = selectedMembers.value.indexOf(id)
  if (idx >= 0) selectedMembers.value.splice(idx, 1)
  else selectedMembers.value.push(id)
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
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="member in members"
                  :key="member.id"
                  type="button"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
                  :class="selectedMembers.includes(member.id)
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'"
                  @click="toggleMember(member.id)"
                >
                  {{ member.full_name }}
                </button>
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
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                {{ team.term }}
              </span>
            </div>
            <div v-if="team.team_members.length > 0" class="flex flex-wrap gap-1.5">
              <span
                v-for="(tm, i) in team.team_members"
                :key="i"
                class="px-2.5 py-1 text-xs rounded-full bg-gray-800 text-gray-300"
              >
                {{ tm.profiles.full_name }}
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
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
