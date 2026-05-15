<script setup lang="ts">
const supabase = useSupabase()
const router = useRouter()
const route = useRoute()

const profileName = ref('')
const profileRole = ref('')
const sidebarOpen = ref(false)
const userMenuOpen = ref(false)

function closeUserMenu() {
  userMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeUserMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu)
})

const initials = computed(() => {
  if (!profileName.value) return ''
  return profileName.value
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
})

interface NavItem {
  to: string
  label: string
  icon: string
}

interface NavSection {
  title: string
  adminOnly?: boolean
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { to: '/dashboard', label: 'Inicio', icon: 'home' },
      { to: '/extracto', label: 'Mis Movimientos', icon: 'list' },
      { to: '/prestamos', label: 'Préstamos', icon: 'banknotes' },
      { to: '/actividades', label: 'Actividades', icon: 'sparkles' },
    ],
  },
  {
    title: 'Fondo',
    items: [
      { to: '/junta', label: 'Junta Directiva', icon: 'users' },
      { to: '/estatutos', label: 'Estatutos', icon: 'book' },
    ],
  },
  {
    title: 'Administración',
    adminOnly: true,
    items: [
      { to: '/admin', label: 'Panel', icon: 'shield' },
      { to: '/admin/miembros', label: 'Miembros', icon: 'users' },
      { to: '/admin/retiros', label: 'Retiros', icon: 'banknotes' },
      { to: '/admin/reuniones', label: 'Reuniones', icon: 'calendar' },
      { to: '/admin/inversiones', label: 'Inversiones', icon: 'trending' },
      { to: '/admin/balance', label: 'Balance', icon: 'chart' },
      { to: '/admin/cierre-anual', label: 'Cierre Anual', icon: 'gift' },
      { to: '/admin/parametros', label: 'Parámetros', icon: 'cog' },
    ],
  },
]

const visibleSections = computed(() =>
  navSections.filter(s => !s.adminOnly || profileRole.value === 'admin'),
)

function isActive(to: string): boolean {
  if (to === '/dashboard') return route.path === '/dashboard'
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(to + '/')
}

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (data) {
    profileName.value = data.full_name
    profileRole.value = data.role
  }
})

// Cerrar sidebar al navegar en móvil
watch(() => route.path, () => {
  sidebarOpen.value = false
})

async function handleLogout() {
  await supabase.auth.signOut()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <!-- ==================== SIDEBAR ==================== -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-5 border-b border-gray-800">
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-base font-bold text-white tracking-tight">FODAF</span>
            <span class="text-[10px] text-gray-500 uppercase tracking-widest">Fondo Familiar</span>
          </div>
        </NuxtLink>
        <button
          class="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          @click="sidebarOpen = false"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Nav sections -->
      <nav class="flex-1 overflow-y-auto py-5 px-3 space-y-6" style="max-height: calc(100vh - 4rem);">
        <div v-for="section in visibleSections" :key="section.title">
          <p class="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            {{ section.title }}
          </p>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in section.items"
              :key="item.to"
              :to="item.to"
              class="group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              :class="isActive(item.to)
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'"
            >
              <span
                v-if="isActive(item.to)"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-emerald-400 rounded-r-full"
              />
              <!-- Icons -->
              <svg v-if="item.icon === 'home'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <svg v-else-if="item.icon === 'banknotes'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
              <svg v-else-if="item.icon === 'users'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <svg v-else-if="item.icon === 'book'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <svg v-else-if="item.icon === 'shield'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <svg v-else-if="item.icon === 'calendar'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
              </svg>
              <svg v-else-if="item.icon === 'sparkles'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
              <svg v-else-if="item.icon === 'trending'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
              <svg v-else-if="item.icon === 'chart'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              <svg v-else-if="item.icon === 'list'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <svg v-else-if="item.icon === 'gift'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              <svg v-else-if="item.icon === 'cog'" class="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.991l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </div>
      </nav>
    </aside>

    <!-- Backdrop para móvil -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/60 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- ==================== CONTENIDO ==================== -->
    <div class="lg:pl-64">
      <!-- Topbar -->
      <header class="sticky top-0 z-20 h-16 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div class="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <!-- Botón menú móvil -->
          <button
            class="lg:hidden p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            @click="sidebarOpen = true"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div class="lg:hidden flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="text-base font-bold text-white tracking-tight">FODAF</span>
          </div>

          <div class="flex-1" />

          <!-- User dropdown -->
          <div class="relative">
            <button
              class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
              @click.stop="userMenuOpen = !userMenuOpen"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                :class="profileRole === 'admin'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'"
              >
                {{ initials }}
              </div>
              <div class="hidden sm:flex flex-col items-start leading-tight">
                <span class="text-sm font-medium text-white">{{ profileName }}</span>
                <span class="text-[11px] text-gray-500">
                  {{ profileRole === 'admin' ? 'Administrador' : 'Miembro' }}
                </span>
              </div>
              <svg
                class="w-4 h-4 text-gray-500 transition-transform"
                :class="{ 'rotate-180': userMenuOpen }"
                fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-56 rounded-xl bg-gray-900 border border-gray-800 shadow-xl shadow-black/40 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-gray-800 sm:hidden">
                  <p class="text-sm font-medium text-white">{{ profileName }}</p>
                  <p class="text-xs text-gray-400">
                    {{ profileRole === 'admin' ? 'Administrador' : 'Miembro' }}
                  </p>
                </div>

                <div class="py-1">
                  <NuxtLink
                    to="/perfil"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                    @click="userMenuOpen = false"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    Mi Perfil
                  </NuxtLink>

                  <button
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                    @click="handleLogout"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Main -->
      <main class="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
