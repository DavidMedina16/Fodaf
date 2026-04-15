<script setup lang="ts">
interface ProfileOption {
  id: string
  full_name: string
}

interface AdminWithdrawal {
  id: string
  profile_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: { full_name: string }
}

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()

const withdrawals = ref<AdminWithdrawal[]>([])
const profiles = ref<ProfileOption[]>([])
const loading = ref(true)
const processingId = ref<string | null>(null)
const filter = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')

const editing = ref<AdminWithdrawal | null>(null)
const saving = ref(false)
const deleteTarget = ref<AdminWithdrawal | null>(null)
const deleting = ref(false)

async function loadData() {
  loading.value = true
  const [wResult, pResult] = await Promise.all([
    supabase
      .from('withdrawals')
      .select('id, profile_id, amount, status, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ])
  withdrawals.value = (wResult.data as unknown as AdminWithdrawal[]) ?? []
  profiles.value = (pResult.data as unknown as ProfileOption[]) ?? []
  loading.value = false
}

const filteredWithdrawals = computed(() =>
  filter.value === 'all' ? withdrawals.value : withdrawals.value.filter(w => w.status === filter.value),
)

async function setStatus(id: string, status: 'approved' | 'rejected') {
  processingId.value = id
  const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id)
  processingId.value = null
  if (error) {
    toast.error('Error al actualizar el retiro.')
    return
  }
  toast.success(status === 'approved' ? 'Retiro aprobado.' : 'Retiro rechazado.')
  await loadData()
}

function openEdit(w: AdminWithdrawal) {
  editing.value = { ...w }
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  const w = editing.value
  const { error } = await supabase
    .from('withdrawals')
    .update({ profile_id: w.profile_id, amount: w.amount, status: w.status })
    .eq('id', w.id)
  saving.value = false
  if (error) {
    toast.error('Error al guardar el retiro.')
    return
  }
  toast.success('Retiro actualizado.')
  editing.value = null
  await loadData()
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const { error } = await supabase.from('withdrawals').delete().eq('id', deleteTarget.value.id)
  deleting.value = false
  if (error) {
    toast.error(`No se pudo eliminar: ${error.message}`)
    return
  }
  toast.success('Retiro eliminado.')
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
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const statusClasses: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Solicitudes de Retiro</h1>
      <p class="text-gray-400 mt-1">Gestiona los retiros solicitados por los miembros.</p>
    </div>

    <div class="flex gap-2 mb-4">
      <button
        v-for="f in (['pending', 'approved', 'rejected', 'all'] as const)"
        :key="f"
        class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
        :class="filter === f
          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'"
        @click="filter = f"
      >
        {{ f === 'all' ? 'Todos' : statusLabels[f] }}
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse bg-gray-900 rounded-xl h-20 border border-gray-800" />
    </div>

    <template v-else>
      <div
        v-if="filteredWithdrawals.length === 0"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
      >
        <p class="text-gray-400 text-lg">No hay retiros para mostrar.</p>
      </div>

      <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-800">
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Miembro</th>
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Fecha</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Monto</th>
              <th class="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Estado</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="w in filteredWithdrawals"
              :key="w.id"
              class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
            >
              <td class="px-6 py-4"><span class="text-sm font-medium text-white">{{ w.profiles.full_name }}</span></td>
              <td class="px-6 py-4"><span class="text-sm text-gray-300">{{ formatDate(w.created_at) }}</span></td>
              <td class="px-6 py-4 text-right"><span class="text-sm font-semibold text-white">{{ formatCOP(w.amount) }}</span></td>
              <td class="px-6 py-4 text-center">
                <span class="px-2 py-0.5 text-xs font-medium rounded-full" :class="statusClasses[w.status]">
                  {{ statusLabels[w.status] }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <template v-if="w.status === 'pending'">
                    <button
                      :disabled="processingId === w.id"
                      class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                      @click="setStatus(w.id, 'approved')"
                    >
                      Aprobar
                    </button>
                    <button
                      :disabled="processingId === w.id"
                      class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
                      @click="setStatus(w.id, 'rejected')"
                    >
                      Rechazar
                    </button>
                  </template>
                  <button
                    class="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                    title="Editar"
                    @click="openEdit(w)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    class="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                    title="Eliminar"
                    @click="deleteTarget = w"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Modal editar -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="editing = null" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Retiro</h2>
            <form class="space-y-4" @submit.prevent="saveEdit">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Miembro</label>
                <select
                  v-model="editing.profile_id"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.full_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Monto (COP)</label>
                <input
                  v-model.number="editing.amount"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <select
                  v-model="editing.status"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="editing = null"
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
      title="Eliminar retiro"
      :message="deleteTarget ? `¿Seguro que quieres eliminar el retiro de ${deleteTarget.profiles.full_name} (${formatCOP(deleteTarget.amount)})? Esta acción no se puede deshacer.` : ''"
      :loading="deleting"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
