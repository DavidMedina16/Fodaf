<script setup lang="ts">
type InvestmentStatus = 'active' | 'completed'

interface Investment {
  id: string
  name: string
  invested_amount: number
  annual_interest_rate: number
  start_date: string
  end_date: string
  status: InvestmentStatus
  actual_return: number | null
  created_at: string
}

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()
const { toLocalDate } = useLocalDate()

const investments = ref<Investment[]>([])
const loading = ref(true)
const submitting = ref(false)
const processingId = ref<string | null>(null)

const finalizingInvestment = ref<Investment | null>(null)
const finalizeReturn = ref<number | null>(null)
const finalizeSubmitting = ref(false)

const editing = ref<Investment | null>(null)
const saving = ref(false)
const deleteTarget = ref<Investment | null>(null)
const deleting = ref(false)

const name = ref('')
const investedAmount = ref<number | null>(null)
const annualRate = ref<number | null>(null)
const startDate = ref(toLocalDate())
const endDate = ref('')

async function loadInvestments() {
  const { data } = await supabase
    .from('investments')
    .select('*')
    .order('created_at', { ascending: false })

  investments.value = (data as Investment[]) ?? []
  loading.value = false
}

function resetForm() {
  name.value = ''
  investedAmount.value = null
  annualRate.value = null
  startDate.value = toLocalDate()
  endDate.value = ''
}

async function handleSubmit() {
  if (!name.value || !investedAmount.value || annualRate.value === null || !startDate.value || !endDate.value) return

  if (endDate.value < startDate.value) {
    toast.error('La fecha de vencimiento debe ser posterior a la de inicio.')
    return
  }

  submitting.value = true

  const { error } = await supabase.from('investments').insert({
    name: name.value,
    invested_amount: investedAmount.value,
    annual_interest_rate: annualRate.value,
    start_date: startDate.value,
    end_date: endDate.value,
    status: 'active',
  })

  submitting.value = false

  if (error) {
    toast.error('Error al registrar la inversión.')
    return
  }

  toast.success('Inversión registrada.')
  resetForm()
  await loadInvestments()
}

function openFinalizeModal(inv: Investment) {
  finalizingInvestment.value = inv
  finalizeReturn.value = Math.round(projectedInterest(inv))
}

function closeFinalizeModal() {
  finalizingInvestment.value = null
  finalizeReturn.value = null
}

async function confirmFinalize() {
  if (!finalizingInvestment.value || finalizeReturn.value === null || finalizeReturn.value < 0) return

  finalizeSubmitting.value = true

  const { error } = await supabase
    .from('investments')
    .update({ status: 'completed', actual_return: finalizeReturn.value })
    .eq('id', finalizingInvestment.value.id)

  finalizeSubmitting.value = false

  if (error) {
    toast.error('Error al finalizar la inversión.')
    return
  }

  toast.success('Inversión finalizada. Rendimiento sumado al capital.')
  closeFinalizeModal()
  await loadInvestments()
}

function openEdit(inv: Investment) {
  editing.value = { ...inv }
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  const i = editing.value
  const { error } = await supabase
    .from('investments')
    .update({
      name: i.name,
      invested_amount: i.invested_amount,
      annual_interest_rate: i.annual_interest_rate,
      start_date: i.start_date,
      end_date: i.end_date,
      status: i.status,
      actual_return: i.actual_return,
    })
    .eq('id', i.id)
  saving.value = false
  if (error) {
    toast.error('Error al guardar la inversión.')
    return
  }
  toast.success('Inversión actualizada.')
  editing.value = null
  await loadInvestments()
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const { error } = await supabase.from('investments').delete().eq('id', deleteTarget.value.id)
  deleting.value = false
  if (error) {
    toast.error(`No se pudo eliminar: ${error.message}`)
    return
  }
  toast.success('Inversión eliminada.')
  deleteTarget.value = null
  await loadInvestments()
}

async function reactivateInvestment(id: string) {
  processingId.value = id

  const { error } = await supabase
    .from('investments')
    .update({ status: 'active', actual_return: null })
    .eq('id', id)

  processingId.value = null

  if (error) {
    toast.error('Error al reactivar la inversión.')
    return
  }

  toast.success('Inversión reactivada.')
  await loadInvestments()
}

function daysBetween(from: string, to: Date): number {
  const start = new Date(from + 'T00:00:00')
  const diffMs = to.getTime() - start.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function accruedInterest(inv: Investment): number {
  const now = new Date()
  const end = new Date(inv.end_date + 'T23:59:59')
  const cutoff = now > end ? end : now
  const elapsed = daysBetween(inv.start_date, cutoff)
  return inv.invested_amount * (inv.annual_interest_rate / 100) * (elapsed / 365)
}

function projectedInterest(inv: Investment): number {
  const total = daysBetween(inv.start_date, new Date(inv.end_date + 'T23:59:59'))
  return inv.invested_amount * (inv.annual_interest_rate / 100) * (total / 365)
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
    month: 'short',
    year: 'numeric',
  })
}

const statusLabel: Record<InvestmentStatus, string> = {
  active: 'Activa',
  completed: 'Finalizada',
}

const statusClasses: Record<InvestmentStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-gray-500/20 text-gray-400',
}

onMounted(loadInvestments)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Inversiones Externas</h1>
      <p class="text-gray-400 mt-1">Registra y gestiona las inversiones del fondo (CDT, fiducias, etc.).</p>
    </div>

    <!-- Formulario -->
    <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
      <h2 class="text-lg font-semibold text-white mb-4">Nueva Inversión</h2>
      <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="CDT Bancolombia 180 días"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Monto invertido (COP)</label>
          <input
            v-model.number="investedAmount"
            type="number"
            required
            min="1"
            step="1"
            placeholder="1000000"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Tasa de interés anual (%)</label>
          <input
            v-model.number="annualRate"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="12.5"
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Fecha de inicio</label>
          <input
            v-model="startDate"
            type="date"
            required
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Fecha de vencimiento</label>
          <input
            v-model="endDate"
            type="date"
            required
            class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        <div class="md:col-span-2">
          <button
            type="submit"
            :disabled="submitting"
            class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Guardando...' : 'Registrar Inversión' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Listado -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse bg-gray-900 rounded-xl h-20 border border-gray-800"
      />
    </div>

    <template v-else>
      <div
        v-if="investments.length === 0"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
      >
        <p class="text-gray-400 text-lg">Aún no hay inversiones registradas.</p>
      </div>

      <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-800">
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Nombre</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Monto</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Tasa</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Rendimiento</th>
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Vigencia</th>
              <th class="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Estado</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inv in investments"
              :key="inv.id"
              class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
            >
              <td class="px-6 py-4">
                <span class="text-sm font-medium text-white">{{ inv.name }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <span class="text-sm font-semibold text-white">{{ formatCOP(inv.invested_amount) }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <span class="text-sm text-gray-300">{{ inv.annual_interest_rate }}%</span>
              </td>
              <td class="px-6 py-4 text-right">
                <template v-if="inv.status === 'completed' && inv.actual_return !== null">
                  <p class="text-sm font-semibold text-emerald-400">+{{ formatCOP(inv.actual_return) }}</p>
                  <p class="text-[11px] text-gray-500 mt-0.5">Rendimiento real obtenido</p>
                </template>
                <template v-else>
                  <p class="text-sm font-semibold text-emerald-400">+{{ formatCOP(accruedInterest(inv)) }}</p>
                  <p class="text-[11px] text-gray-500 mt-0.5">
                    Proyectado: {{ formatCOP(projectedInterest(inv)) }}
                  </p>
                </template>
              </td>
              <td class="px-6 py-4">
                <span class="text-xs text-gray-400">
                  {{ formatDate(inv.start_date) }} → {{ formatDate(inv.end_date) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="statusClasses[inv.status]"
                >
                  {{ statusLabel[inv.status] }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="inv.status === 'active'"
                    class="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-600 transition"
                    @click="openFinalizeModal(inv)"
                  >
                    Finalizar
                  </button>
                  <button
                    v-else
                    :disabled="processingId === inv.id"
                    class="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-50"
                    @click="reactivateInvestment(inv.id)"
                  >
                    Reactivar
                  </button>
                  <button
                    class="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                    title="Editar"
                    @click="openEdit(inv)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    class="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                    title="Eliminar"
                    @click="deleteTarget = inv"
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

    <!-- Modal de finalización -->
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
          v-if="finalizingInvestment"
          class="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div class="absolute inset-0 bg-black/60" @click="closeFinalizeModal" />

          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-white">Finalizar Inversión</h2>
              <button class="text-gray-500 hover:text-white transition" @click="closeFinalizeModal">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <div class="mb-5 rounded-lg bg-gray-800/50 px-4 py-3">
              <p class="text-xs text-gray-400 uppercase tracking-wider">{{ finalizingInvestment.name }}</p>
              <p class="text-lg font-bold text-white mt-1">{{ formatCOP(finalizingInvestment.invested_amount) }}</p>
              <p class="text-xs text-gray-500 mt-1">
                Tasa {{ finalizingInvestment.annual_interest_rate }}% · Proyectado: {{ formatCOP(projectedInterest(finalizingInvestment)) }}
              </p>
            </div>

            <form @submit.prevent="confirmFinalize" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">
                  Rendimiento real obtenido (COP)
                </label>
                <input
                  v-model.number="finalizeReturn"
                  type="number"
                  required
                  min="0"
                  step="1"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Ajusta el monto al rendimiento real pagado por el banco. El capital invertido vuelve a Caja automáticamente.
                </p>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="closeFinalizeModal"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="finalizeSubmitting || finalizeReturn === null || finalizeReturn < 0"
                  class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ finalizeSubmitting ? 'Guardando...' : 'Confirmar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal editar inversión -->
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
            <h2 class="text-xl font-bold text-white mb-6">Editar Inversión</h2>
            <form class="space-y-4" @submit.prevent="saveEdit">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  v-model="editing.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Monto invertido (COP)</label>
                <input
                  v-model.number="editing.invested_amount"
                  type="number"
                  min="1"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Tasa de interés anual (%)</label>
                <input
                  v-model.number="editing.annual_interest_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Inicio</label>
                  <input
                    v-model="editing.start_date"
                    type="date"
                    required
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Vencimiento</label>
                  <input
                    v-model="editing.end_date"
                    type="date"
                    required
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <select
                  v-model="editing.status"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="active">Activa</option>
                  <option value="completed">Finalizada</option>
                </select>
              </div>
              <div v-if="editing.status === 'completed'">
                <label class="block text-sm font-medium text-gray-300 mb-1">Rendimiento real (COP)</label>
                <input
                  v-model.number="editing.actual_return"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
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
      title="Eliminar inversión"
      :message="deleteTarget ? `¿Seguro que quieres eliminar la inversión \&quot;${deleteTarget.name}\&quot;? Esta acción no se puede deshacer.` : ''"
      :loading="deleting"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
