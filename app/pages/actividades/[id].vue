<script setup lang="ts">
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ActivityStatus, MemberRole } from '~~/types/database'

interface ActivityDetail {
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
}

interface ExpenseRow {
  id: string
  description: string
  amount: number
  created_at: string
}

interface ProductRow {
  id: string
  name: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  created_at: string
}

interface SaleRow {
  id: string
  quantity: number
  total_price: number
  buyer_id: string | null
  buyer_name: string | null
  product_id: string
  created_at: string
  activity_products: { name: string } | null
  seller: { full_name: string } | null
  buyer: { full_name: string } | null
}

interface MemberOption {
  id: string
  full_name: string
}

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabase()
const toast = useToast()

const activityId = route.params.id as string

const currentUserId = ref<string | null>(null)
const currentUserRole = ref<MemberRole | null>(null)

const activity = ref<ActivityDetail | null>(null)
const expenses = ref<ExpenseRow[]>([])
const products = ref<ProductRow[]>([])
const sales = ref<SaleRow[]>([])
const members = ref<MemberOption[]>([])
const loading = ref(true)
const accessDenied = ref(false)

// Forms (solo si canEdit)
const expenseDescription = ref('')
const expenseAmount = ref<number | null>(null)
const addingExpense = ref(false)

const productName = ref('')
const productCostPrice = ref<number | null>(null)
const productSellingPrice = ref<number | null>(null)
const productStock = ref<number | null>(null)
const addingProduct = ref(false)

const editingExpense = ref<ExpenseRow | null>(null)
const savingExpense = ref(false)

const editingProduct = ref<ProductRow | null>(null)
const savingProduct = ref(false)

const deleteTarget = ref<{ kind: 'expense' | 'product' | 'sale'; id: string; label: string } | null>(null)
const deleting = ref(false)

// Modal Nueva Venta / Editar Venta
const saleModalOpen = ref(false)
const editingSale = ref<SaleRow | null>(null)

// Modales de finalizar / reabrir
const finalizeOpen = ref(false)
const finalizing = ref(false)
const reopenOpen = ref(false)
const reopening = ref(false)

let channel: RealtimeChannel | null = null

// ---- Permisos ----
const committeeMemberIds = computed(() =>
  activity.value?.teams?.team_members.map(m => m.profile_id) ?? [],
)

const activityStatus = computed<ActivityStatus | null>(() => activity.value?.status ?? null)
const activityStartAt = computed<string | null>(() => activity.value?.start_at ?? null)

const {
  isAdmin,
  isCommitteeMember,
  effectiveStatus,
  canViewDetail,
  canEdit,
  canFinalize,
  canReopen,
} = useActivityPermissions({
  currentUserId,
  currentUserRole,
  activityStatus,
  activityStartAt,
  committeeMemberIds,
})

// El POS de ventas solo cuando la actividad efectivamente está
// "En curso" (la hora de inicio ya llegó). Si está `scheduled`,
// el comité puede registrar gastos e inventario, pero las ventas
// se desbloquean al cruzar la hora.
const canSell = computed(() => canEdit.value && effectiveStatus.value === 'in_progress')

// Exportar PDF: solo admin o miembros del comité, y únicamente
// cuando la actividad está cerrada (los números ya no cambian).
const canExport = computed(() =>
  (isAdmin.value || isCommitteeMember.value) && effectiveStatus.value === 'finished',
)

function handleExportPdf() {
  if (!activity.value) return

  exportActivityReportPdf({
    activity: {
      name: activity.value.name,
      activity_date: activity.value.activity_date,
      start_at: activity.value.start_at,
      finished_at: activity.value.finished_at,
      team_name: activity.value.teams?.name ?? null,
    },
    expenses: expenses.value.map(e => ({
      description: e.description,
      amount: e.amount,
    })),
    products: products.value.map(p => ({
      name: p.name,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      stock_quantity: p.stock_quantity,
      sold: soldOf(p.id),
      available: availableOf(p),
    })),
    sales: sales.value.map(s => ({
      product_name: s.activity_products?.name ?? '—',
      quantity: s.quantity,
      buyer_label: buyerLabel(s),
      seller_label: s.seller?.full_name ?? '—',
      total_price: s.total_price,
    })),
  })

  toast.success('Reporte PDF abierto en nueva pestaña. Guárdalo con Ctrl/Cmd + S.')
}

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
  const [activityRes, expensesRes, productsRes, salesRes, membersRes] = await Promise.all([
    supabase
      .from('activities')
      .select('id, name, activity_date, start_at, status, finished_at, team_id, teams(name, team_members(profile_id))')
      .eq('id', activityId)
      .single(),
    supabase
      .from('activity_expenses')
      .select('id, description, amount, created_at')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_products')
      .select('id, name, cost_price, selling_price, stock_quantity, created_at')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_sales')
      .select('id, quantity, total_price, buyer_id, buyer_name, product_id, created_at, activity_products(name), seller:profiles!seller_id(full_name), buyer:profiles!buyer_id(full_name)')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name'),
  ])

  activity.value = (activityRes.data as unknown as ActivityDetail | null) ?? null
  expenses.value = (expensesRes.data as unknown as ExpenseRow[]) ?? []
  products.value = (productsRes.data as unknown as ProductRow[]) ?? []
  sales.value = (salesRes.data as unknown as SaleRow[]) ?? []
  members.value = (membersRes.data as unknown as MemberOption[]) ?? []
  loading.value = false
}

// Etiqueta de comprador para la tabla: nombre del miembro (vía
// join `buyer_id`) o el texto libre (`buyer_name`) o "—".
function buyerLabel(sale: SaleRow): string {
  return sale.buyer?.full_name ?? sale.buyer_name ?? '—'
}

// ---- Matemática financiera del evento (derivada, en tiempo real) ----
const totalExpenses = computed(() =>
  expenses.value.reduce((sum, e) => sum + e.amount, 0),
)

const totalInventoryCost = computed(() =>
  products.value.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0),
)

const totalCosts = computed(() => totalExpenses.value + totalInventoryCost.value)

const grossIncome = computed(() =>
  sales.value.reduce((sum, s) => sum + s.total_price, 0),
)

const netProfit = computed(() => grossIncome.value - totalCosts.value)

function soldOf(productId: string): number {
  return sales.value
    .filter(s => s.product_id === productId)
    .reduce((sum, s) => sum + s.quantity, 0)
}

function availableOf(product: ProductRow): number {
  return product.stock_quantity - soldOf(product.id)
}

// Productos para el modal de venta (con stock disponible calculado).
const productOptions = computed(() =>
  products.value.map(p => ({
    id: p.id,
    name: p.name,
    selling_price: p.selling_price,
    available: availableOf(p),
  })),
)

// ---- Acciones (todas dependen de canEdit en el server, vía RLS) ----
async function addExpense() {
  if (!expenseDescription.value.trim() || !expenseAmount.value || expenseAmount.value <= 0) return

  addingExpense.value = true
  const { error } = await supabase.from('activity_expenses').insert({
    activity_id: activityId,
    description: expenseDescription.value.trim(),
    amount: expenseAmount.value,
  })
  addingExpense.value = false

  if (error) {
    toast.error('Error al registrar el gasto.')
    return
  }

  toast.success('Gasto registrado.')
  expenseDescription.value = ''
  expenseAmount.value = null
  await loadData()
}

async function addProduct() {
  if (
    !productName.value.trim()
    || productCostPrice.value === null || productCostPrice.value < 0
    || productSellingPrice.value === null || productSellingPrice.value < 0
    || productStock.value === null || productStock.value < 0
  ) return

  addingProduct.value = true
  const { error } = await supabase.from('activity_products').insert({
    activity_id: activityId,
    name: productName.value.trim(),
    cost_price: productCostPrice.value,
    selling_price: productSellingPrice.value,
    stock_quantity: productStock.value,
  })
  addingProduct.value = false

  if (error) {
    toast.error('Error al crear el producto.')
    return
  }

  toast.success('Producto agregado al inventario.')
  productName.value = ''
  productCostPrice.value = null
  productSellingPrice.value = null
  productStock.value = null
  await loadData()
}

function openEditExpense(expense: ExpenseRow) {
  editingExpense.value = { ...expense }
}

async function saveExpenseEdit() {
  if (!editingExpense.value) return
  const e = editingExpense.value

  if (!e.description.trim() || !e.amount || e.amount <= 0) return

  savingExpense.value = true
  const { error } = await supabase
    .from('activity_expenses')
    .update({
      description: e.description.trim(),
      amount: e.amount,
    })
    .eq('id', e.id)
  savingExpense.value = false

  if (error) {
    toast.error('Error al actualizar el gasto.')
    return
  }

  toast.success('Gasto actualizado.')
  editingExpense.value = null
  await loadData()
}

function openEditProduct(product: ProductRow) {
  editingProduct.value = { ...product }
}

async function saveProductEdit() {
  if (!editingProduct.value) return
  const p = editingProduct.value

  if (
    !p.name.trim()
    || p.cost_price < 0 || p.selling_price < 0 || p.stock_quantity < 0
  ) return

  if (p.stock_quantity < soldOf(p.id)) {
    toast.error(`El stock no puede ser menor a las ${soldOf(p.id)} unidades ya vendidas.`)
    return
  }

  savingProduct.value = true
  const { error } = await supabase
    .from('activity_products')
    .update({
      name: p.name.trim(),
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      stock_quantity: p.stock_quantity,
    })
    .eq('id', p.id)
  savingProduct.value = false

  if (error) {
    toast.error('Error al actualizar el producto.')
    return
  }

  toast.success('Producto actualizado.')
  editingProduct.value = null
  await loadData()
}

function askDeleteExpense(expense: ExpenseRow) {
  deleteTarget.value = { kind: 'expense', id: expense.id, label: `el gasto "${expense.description}"` }
}

function askDeleteProduct(product: ProductRow) {
  deleteTarget.value = {
    kind: 'product',
    id: product.id,
    label: `el producto "${product.name}" y todas sus ventas`,
  }
}

function askDeleteSale(sale: SaleRow) {
  deleteTarget.value = {
    kind: 'sale',
    id: sale.id,
    label: `la venta de ${sale.quantity} × ${sale.activity_products?.name ?? 'producto'} (${formatCOP(sale.total_price)})`,
  }
}

// ---- Editar venta ----
function openEditSale(sale: SaleRow) {
  editingSale.value = sale
  saleModalOpen.value = true
}

function closeSaleModal() {
  saleModalOpen.value = false
  editingSale.value = null
}

const editingSalePayload = computed(() => {
  if (!editingSale.value) return null
  const s = editingSale.value
  return {
    id: s.id,
    product_id: s.product_id,
    quantity: s.quantity,
    buyer_id: s.buyer_id,
    buyer_name: s.buyer_name,
  }
})

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const table = deleteTarget.value.kind === 'expense'
    ? 'activity_expenses'
    : deleteTarget.value.kind === 'product'
      ? 'activity_products'
      : 'activity_sales'
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

// ---- Finalizar / Reabrir actividad ----
async function confirmFinalize() {
  finalizing.value = true
  const { error } = await supabase.rpc('finish_activity', { p_activity_id: activityId })
  finalizing.value = false

  if (error) {
    toast.error(`No se pudo finalizar: ${error.message}`)
    return
  }

  toast.success('Actividad finalizada. Ya es visible para todos los miembros.')
  finalizeOpen.value = false
  await loadData()
}

async function confirmReopen() {
  reopening.value = true
  const { error } = await supabase.rpc('reopen_activity', { p_activity_id: activityId })
  reopening.value = false

  if (error) {
    toast.error(`No se pudo reabrir: ${error.message}`)
    return
  }

  toast.success('Actividad reabierta. El comité puede volver a editar.')
  reopenOpen.value = false
  await loadData()
}

onMounted(async () => {
  await loadCurrentUser()
  await loadData()

  // Si la actividad existe pero el usuario no tiene permiso para ver
  // el detalle (está in_progress y no es admin/comité), redirigimos.
  if (activity.value && !canViewDetail.value) {
    accessDenied.value = true
    return
  }

  // Realtime: el dashboard se actualiza en vivo a medida que los
  // miembros del comité registran ventas, gastos o productos.
  channel = supabase
    .channel(`activity-detail-${activityId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activities', filter: `id=eq.${activityId}` },
      () => loadData(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activity_expenses', filter: `activity_id=eq.${activityId}` },
      () => loadData(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activity_products', filter: `activity_id=eq.${activityId}` },
      () => loadData(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activity_sales', filter: `activity_id=eq.${activityId}` },
      () => loadData(),
    )
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/actividades" class="text-sm text-gray-400 hover:text-white transition">
        &larr; Volver a Actividades
      </NuxtLink>
      <div v-if="activity" class="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-white">{{ activity.name }}</h1>
            <span
              v-if="effectiveStatus === 'scheduled'"
              class="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-wider"
            >
              Programada
            </span>
            <span
              v-else-if="effectiveStatus === 'in_progress'"
              class="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 uppercase tracking-wider"
            >
              En curso
            </span>
            <span
              v-else
              class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 uppercase tracking-wider"
            >
              Finalizada
            </span>
          </div>
          <p class="text-gray-400 mt-1">
            <span v-if="activity.start_at">{{ formatDatetime(activity.start_at) }}</span>
            <span v-else>{{ formatDate(activity.activity_date) }}</span>
            <span v-if="activity.teams"> · {{ activity.teams.name }}</span>
            <span v-if="activity.status === 'finished' && activity.finished_at" class="text-gray-500">
              · cerrada el {{ formatDate(activity.finished_at.slice(0, 10)) }}
            </span>
          </p>
        </div>

        <!-- Acciones de cabecera -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="canSell && products.length > 0"
            class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition"
            @click="(editingSale = null, saleModalOpen = true)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva Venta
          </button>
          <button
            v-if="canFinalize"
            class="inline-flex items-center gap-1.5 rounded-lg bg-yellow-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-500 transition"
            @click="finalizeOpen = true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Finalizar actividad
          </button>
          <button
            v-if="canExport"
            class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
            @click="handleExportPdf"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
            </svg>
            Exportar PDF
          </button>
          <button
            v-if="canReopen"
            class="inline-flex items-center gap-1.5 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition"
            @click="reopenOpen = true"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reabrir
          </button>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse bg-gray-900 rounded-2xl h-28 border border-gray-800" />
      <div class="animate-pulse bg-gray-900 rounded-2xl h-64 border border-gray-800" />
    </div>

    <div v-else-if="!activity" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
      <p class="text-gray-400">La actividad no existe.</p>
    </div>

    <!-- Acceso denegado: actividad en curso, usuario no es admin ni del comité -->
    <div v-else-if="accessDenied || !canViewDetail" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
      <div class="w-12 h-12 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-white">
        <template v-if="effectiveStatus === 'scheduled'">Esta actividad aún no comienza</template>
        <template v-else>Esta actividad está en curso</template>
      </h2>
      <p class="text-sm text-gray-400 mt-1">
        Solo los miembros del comité organizador pueden ver el detalle hasta que la actividad sea finalizada. Podrás ver todos los movimientos al cierre.
      </p>
      <button
        class="mt-6 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition"
        @click="router.push('/actividades')"
      >
        Volver a Actividades
      </button>
    </div>

    <template v-else>
      <!-- ==================== DASHBOARD FINANCIERO ==================== -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Costos Totales</p>
          <p class="text-2xl font-bold text-white mt-1">{{ formatCOP(totalCosts) }}</p>
          <p class="text-xs text-gray-500 mt-1">
            Gastos {{ formatCOP(totalExpenses) }} · Inventario {{ formatCOP(totalInventoryCost) }}
          </p>
        </div>
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Ingresos Brutos</p>
          <p class="text-2xl font-bold text-blue-400 mt-1">{{ formatCOP(grossIncome) }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ sales.length }} venta(s) registrada(s)</p>
        </div>
        <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Ganancia Neta</p>
          <p
            class="text-2xl font-bold mt-1"
            :class="netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'"
          >
            {{ formatCOP(netProfit) }}
          </p>
          <p class="text-xs text-gray-500 mt-1">Ingresos − Costos Totales</p>
        </div>
      </div>

      <!-- Aviso: actividad aún no inicia (scheduled-pendiente) -->
      <div
        v-if="effectiveStatus === 'scheduled' && canEdit"
        class="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-3"
      >
        <p class="text-sm text-blue-300">
          Esta actividad está <strong>programada</strong> para
          <span v-if="activity?.start_at">{{ formatDatetime(activity.start_at) }}</span>.
          Puedes preparar gastos e inventario; las ventas se habilitan automáticamente al llegar la hora.
        </p>
      </div>

      <!-- Aviso si está finalizada y el usuario no es admin -->
      <div
        v-if="effectiveStatus === 'finished' && !isAdmin"
        class="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3"
      >
        <p class="text-sm text-emerald-300">
          Esta actividad ya fue finalizada. Estás viendo el cierre en modo solo lectura.
        </p>
      </div>

      <!-- ==================== GASTOS GENERALES ==================== -->
      <div class="mb-10">
        <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Gastos Generales</h2>

        <div v-if="canEdit" class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <h3 class="text-sm font-medium text-white mb-4">Nuevo Gasto</h3>
          <form class="flex flex-col sm:flex-row gap-4" @submit.prevent="addExpense">
            <div class="flex-1">
              <label for="expense-description" class="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
              <input
                id="expense-description"
                v-model="expenseDescription"
                type="text"
                required
                placeholder="Alquiler de sillas, sonido..."
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            <div class="w-full sm:w-48">
              <label for="expense-amount" class="block text-sm font-medium text-gray-300 mb-1">Monto (COP)</label>
              <input
                id="expense-amount"
                v-model.number="expenseAmount"
                type="number"
                required
                min="1"
                placeholder="0"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            <div class="flex items-end">
              <button
                type="submit"
                :disabled="addingExpense"
                class="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ addingExpense ? 'Agregando...' : 'Agregar' }}
              </button>
            </div>
          </form>
        </div>

        <div v-if="expenses.length === 0" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
          <p class="text-gray-400">No hay gastos registrados.</p>
        </div>
        <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-800">
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Descripción</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Monto</th>
                <th v-if="canEdit" class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="expense in expenses"
                :key="expense.id"
                class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-white">{{ expense.description }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-300">{{ formatCOP(expense.amount) }}</span>
                </td>
                <td v-if="canEdit" class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      class="rounded-md bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                      title="Editar"
                      @click="openEditExpense(expense)"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      class="rounded-md bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                      title="Eliminar"
                      @click="askDeleteExpense(expense)"
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

      <!-- ==================== INVENTARIO ==================== -->
      <div class="mb-10">
        <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Inventario</h2>

        <div v-if="canEdit" class="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <h3 class="text-sm font-medium text-white mb-4">Nuevo Producto</h3>
          <form class="space-y-4" @submit.prevent="addProduct">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="product-name" class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  id="product-name"
                  v-model="productName"
                  type="text"
                  required
                  placeholder="Cerveza, gaseosa, empanada..."
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label for="product-stock" class="block text-sm font-medium text-gray-300 mb-1">Cantidad comprada (stock)</label>
                <input
                  id="product-stock"
                  v-model.number="productStock"
                  type="number"
                  required
                  min="0"
                  placeholder="30"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label for="product-cost" class="block text-sm font-medium text-gray-300 mb-1">Costo por unidad (COP)</label>
                <input
                  id="product-cost"
                  v-model.number="productCostPrice"
                  type="number"
                  required
                  min="0"
                  placeholder="2000"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label for="product-price" class="block text-sm font-medium text-gray-300 mb-1">Precio de venta (COP)</label>
                <input
                  id="product-price"
                  v-model.number="productSellingPrice"
                  type="number"
                  required
                  min="0"
                  placeholder="4000"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>
            <button
              type="submit"
              :disabled="addingProduct"
              class="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ addingProduct ? 'Agregando...' : 'Agregar Producto' }}
            </button>
          </form>
        </div>

        <div v-if="products.length === 0" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
          <p class="text-gray-400">No hay productos en el inventario.</p>
        </div>
        <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-800">
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Producto</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Costo</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Venta</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Stock</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Vendidas</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Disponible</th>
                <th v-if="canEdit" class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in products"
                :key="product.id"
                class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-white">{{ product.name }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-400">{{ formatCOP(product.cost_price) }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-300">{{ formatCOP(product.selling_price) }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-300">{{ product.stock_quantity }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-300">{{ soldOf(product.id) }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span
                    class="text-sm font-semibold"
                    :class="availableOf(product) > 0 ? 'text-emerald-400' : 'text-red-400'"
                  >
                    {{ availableOf(product) }}
                  </span>
                </td>
                <td v-if="canEdit" class="px-6 py-4 text-right">
                  <button
                    class="rounded-md bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                    title="Editar producto / stock"
                    @click="openEditProduct(product)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    class="ml-2 rounded-md bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                    title="Eliminar"
                    @click="askDeleteProduct(product)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== VENTAS ==================== -->
      <div>
        <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Ventas Registradas</h2>

        <div v-if="sales.length === 0" class="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
          <p class="text-gray-400">Aún no hay ventas registradas.</p>
          <p v-if="canSell && products.length > 0" class="text-sm text-gray-500 mt-1">
            Usa el botón <strong class="text-emerald-400">"Nueva Venta"</strong> arriba para registrar la primera.
          </p>
          <p v-else-if="canEdit && effectiveStatus === 'scheduled'" class="text-sm text-gray-500 mt-1">
            Las ventas se habilitan automáticamente al llegar la hora de inicio.
          </p>
        </div>
        <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-800">
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Producto</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Cantidad</th>
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Comprador</th>
                <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Vendedor</th>
                <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Total</th>
                <th v-if="canEdit" class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sale in sales"
                :key="sale.id"
                class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
              >
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-white">{{ sale.activity_products?.name ?? '—' }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm text-gray-300">{{ sale.quantity }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-300">{{ buyerLabel(sale) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-300">{{ sale.seller?.full_name ?? '—' }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm font-semibold text-emerald-400">{{ formatCOP(sale.total_price) }}</span>
                </td>
                <td v-if="canEdit" class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      class="rounded-md bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                      title="Editar venta"
                      @click="openEditSale(sale)"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      class="rounded-md bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                      title="Eliminar venta"
                      @click="askDeleteSale(sale)"
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

    <!-- Modal Nueva Venta / Editar Venta -->
    <ActivitySaleModal
      :visible="saleModalOpen"
      :activity-id="activityId"
      :products="productOptions"
      :members="members"
      :editing-sale="editingSalePayload"
      @close="closeSaleModal"
      @saved="loadData"
    />

    <!-- Modal editar gasto -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingExpense" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="editingExpense = null" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Gasto</h2>
            <form class="space-y-4" @submit.prevent="saveExpenseEdit">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                <input
                  v-model="editingExpense.description"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Monto (COP)</label>
                <input
                  v-model.number="editingExpense.amount"
                  type="number"
                  required
                  min="1"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="editingExpense = null"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="savingExpense"
                  class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {{ savingExpense ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal editar producto -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="editingProduct" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="editingProduct = null" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Editar Producto</h2>
            <form class="space-y-4" @submit.prevent="saveProductEdit">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  v-model="editingProduct.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">
                  Stock (cantidad comprada/disponible)
                </label>
                <input
                  v-model.number="editingProduct.stock_quantity"
                  type="number"
                  required
                  min="0"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Ya vendidas: {{ soldOf(editingProduct.id) }}. Aumenta el stock si compraste más durante el evento.
                </p>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Costo (COP)</label>
                  <input
                    v-model.number="editingProduct.cost_price"
                    type="number"
                    required
                    min="0"
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Venta (COP)</label>
                  <input
                    v-model.number="editingProduct.selling_price"
                    type="number"
                    required
                    min="0"
                    class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                  @click="editingProduct = null"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="savingProduct"
                  class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {{ savingProduct ? 'Guardando...' : 'Guardar' }}
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

    <ConfirmModal
      :visible="finalizeOpen"
      title="Finalizar actividad"
      message="¿Confirmar el cierre? Tras finalizar, todos los miembros podrán ver el detalle pero ya no se podrán registrar gastos, productos ni ventas. Solo un admin puede reabrirla."
      variant="warning"
      confirm-label="Sí, finalizar"
      :loading="finalizing"
      @cancel="finalizeOpen = false"
      @confirm="confirmFinalize"
    />

    <ConfirmModal
      :visible="reopenOpen"
      title="Reabrir actividad"
      message="¿Reabrir esta actividad? Volverá a estado 'En curso' y el comité podrá editar gastos, inventario y ventas."
      variant="warning"
      confirm-label="Sí, reabrir"
      :loading="reopening"
      @cancel="reopenOpen = false"
      @confirm="confirmReopen"
    />
  </div>
</template>
