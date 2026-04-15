<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

interface JuntaMember {
  role_title: string | null
  profiles: {
    id: string
    full_name: string
    role: string
  }
}

interface JuntaTeam {
  id: string
  name: string
  term: string
  created_at: string
  team_members: JuntaMember[]
}

const supabase = useSupabase()
const teams = ref<JuntaTeam[]>([])
const loading = ref(true)

async function loadTeams() {
  const { data } = await supabase
    .from('teams')
    .select('id, name, term, created_at, team_members(role_title, profiles(id, full_name, role))')
    .ilike('name', '%junta%')
    .order('created_at', { ascending: false })

  teams.value = (data as unknown as JuntaTeam[]) ?? []
  loading.value = false
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function sortedMembers(members: JuntaMember[]): JuntaMember[] {
  const order = ['presidente', 'vicepresidente', 'tesorero', 'secretario', 'fiscal', 'vocal']
  return [...members].sort((a, b) => {
    const ai = order.indexOf((a.role_title ?? '').toLowerCase())
    const bi = order.indexOf((b.role_title ?? '').toLowerCase())
    const aVal = ai === -1 ? 999 : ai
    const bVal = bi === -1 ? 999 : bi
    return aVal - bVal
  })
}

onMounted(loadTeams)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Junta Directiva</h1>
      <p class="text-gray-400 mt-1">Miembros que lideran y representan al fondo.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="animate-pulse bg-gray-900 rounded-2xl h-48 border border-gray-800" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="teams.length === 0"
      class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
    >
      <p class="text-gray-400">No hay juntas directivas registradas.</p>
      <p class="text-xs text-gray-500 mt-1">Crea un comité con la palabra "Junta" desde el panel de administración.</p>
    </div>

    <!-- Teams -->
    <div v-else class="space-y-10">
      <section v-for="team in teams" :key="team.id">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ team.name }}</h2>
            <p class="text-xs text-gray-500">Período {{ team.term }}</p>
          </div>
          <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
            {{ team.team_members.length }} miembros
          </span>
        </div>

        <div v-if="team.team_members.length === 0" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
          <p class="text-sm text-gray-400">Esta junta aún no tiene miembros asignados.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="member in sortedMembers(team.team_members)"
            :key="member.profiles.id"
            class="group relative bg-gray-900 rounded-2xl border border-gray-800 p-6 hover:border-emerald-500/40 transition-all"
          >
            <!-- Avatar -->
            <div class="flex flex-col items-center text-center">
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ring-2 ring-offset-4 ring-offset-gray-900"
                :class="member.profiles.role === 'admin'
                  ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 text-emerald-300 ring-emerald-500/40'
                  : 'bg-gradient-to-br from-blue-500/30 to-blue-600/10 text-blue-300 ring-blue-500/40'"
              >
                {{ getInitials(member.profiles.full_name) }}
              </div>

              <h3 class="text-base font-semibold text-white">{{ member.profiles.full_name }}</h3>

              <p
                v-if="member.role_title"
                class="mt-1 text-sm font-medium text-emerald-400"
              >
                {{ member.role_title }}
              </p>
              <p v-else class="mt-1 text-xs text-gray-500 italic">Sin cargo asignado</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
