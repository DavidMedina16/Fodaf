<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()

const totalSavings = ref(0)
const totalActiveLoans = ref(0)
const totalActivityProfits = ref(0)
const totalPenaltiesCollected = ref(0)
const totalMembers = ref(0)
const loading = ref(true)

onMounted(async () => {
  const [savingsResult, loansResult, activitiesResult, penaltiesResult, membersResult] = await Promise.all([
    supabase
      .from('contributions')
      .select('amount')
      .eq('status', 'approved'),
    supabase
      .from('loans')
      .select('requested_amount')
      .eq('status', 'active'),
    supabase
      .from('activities')
      .select('net_profits'),
    supabase
      .from('penalties')
      .select('amount, status')
      .in('status', ['paid', 'deducted_from_savings']),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true }),
  ])

  totalSavings.value = savingsResult.data
    ? savingsResult.data.reduce((sum, c) => sum + c.amount, 0)
    : 0

  totalActiveLoans.value = loansResult.data
    ? loansResult.data.reduce((sum, l) => sum + l.requested_amount, 0)
    : 0

  totalActivityProfits.value = activitiesResult.data
    ? activitiesResult.data.reduce((sum, a) => sum + (a.net_profits ?? 0), 0)
    : 0

  totalPenaltiesCollected.value = penaltiesResult.data
    ? penaltiesResult.data.reduce((sum, p) => sum + p.amount, 0)
    : 0

  totalMembers.value = membersResult.count ?? 0

  loading.value = false
})

const capitalInHand = computed(() =>
  totalSavings.value + totalActivityProfits.value + totalPenaltiesCollected.value - totalActiveLoans.value,
)

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Balance Financiero Global</h1>
      <p class="text-gray-400 mt-1">Resumen del estado financiero del fondo FODAF.</p>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="i in 5"
        :key="i"
        class="animate-pulse bg-gray-900 rounded-2xl h-36 border border-gray-800"
      />
    </div>

    <template v-else>
      <!-- Capital en Caja - Card principal -->
      <div class="bg-gradient-to-br from-violet-600/20 to-blue-600/20 rounded-2xl border border-violet-500/30 p-8 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-violet-300 uppercase tracking-wider">Capital Actual en Caja</p>
            <p class="text-5xl font-bold text-white mt-3">{{ formatCOP(capitalInHand) }}</p>
            <p class="text-sm text-violet-300/70 mt-2">Ahorros + Ganancias + Multas − Préstamos activos</p>
          </div>
          <div class="hidden sm:block">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-violet-500/30" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Grid de métricas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Ahorrado -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-400">Total Ahorrado</p>
          </div>
          <p class="text-2xl font-bold text-emerald-400">{{ formatCOP(totalSavings) }}</p>
          <p class="text-xs text-gray-500 mt-1">Aportes aprobados de todos los miembros</p>
        </div>

        <!-- Ganancias Actividades -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-400">Ganancias Actividades</p>
          </div>
          <p class="text-2xl font-bold text-green-400">{{ formatCOP(totalActivityProfits) }}</p>
          <p class="text-xs text-gray-500 mt-1">Utilidad neta de todas las actividades</p>
        </div>

        <!-- Multas Recaudadas -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-400">Multas Recaudadas</p>
          </div>
          <p class="text-2xl font-bold text-yellow-400">{{ formatCOP(totalPenaltiesCollected) }}</p>
          <p class="text-xs text-gray-500 mt-1">Multas pagadas y descontadas</p>
        </div>

        <!-- Préstamos Activos -->
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-400">Préstamos Activos</p>
          </div>
          <p class="text-2xl font-bold text-orange-400">{{ formatCOP(totalActiveLoans) }}</p>
          <p class="text-xs text-gray-500 mt-1">Capital prestado pendiente de cobro</p>
        </div>
      </div>

      <!-- Info miembros -->
      <div class="mt-6 bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-400">Miembros del Fondo</p>
              <p class="text-xs text-gray-500">Total de perfiles registrados</p>
            </div>
          </div>
          <p class="text-3xl font-bold text-white">{{ totalMembers }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
