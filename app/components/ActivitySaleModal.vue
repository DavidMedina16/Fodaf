<script setup lang="ts">
interface ProductOption {
  id: string
  name: string
  selling_price: number
  /** Stock disponible: `stock_quantity` − unidades ya vendidas. */
  available: number
}

interface MemberOption {
  id: string
  full_name: string
}

/** Venta en modo edición. Si está presente, el modal pre-llena
 *  los campos y al guardar hace UPDATE en lugar de INSERT. */
export interface EditingSale {
  id: string
  product_id: string
  quantity: number
  buyer_id: string | null
  buyer_name: string | null
}

const props = defineProps<{
  visible: boolean
  activityId: string
  products: ProductOption[]
  /** Miembros del fondo para el selector de comprador. */
  members: MemberOption[]
  /** Si se pasa, el modal entra en modo edición. */
  editingSale?: EditingSale | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabase()
const toast = useToast()

const selectedProductId = ref('')
const quantity = ref<number | null>(null)

/**
 * Selección de comprador. Valores posibles:
 *   - `''`           → "Sin especificar" (ambos campos quedan null).
 *   - `'__other__'`  → comprador externo (se llena `buyer_name`).
 *   - UUID de perfil → miembro del fondo (se llena `buyer_id`).
 */
const buyerSelection = ref<string>('')
const externalBuyerName = ref('')

const submitting = ref(false)

const isEditing = computed(() => !!props.editingSale)

// Productos visibles en el select: solo los que tienen stock
// disponible. En modo edición, el producto de la venta original
// debe seguir apareciendo aunque su stock haya quedado en 0
// (porque el usuario podría querer mantener el mismo producto).
const availableProducts = computed(() =>
  props.products.filter(p =>
    p.available > 0 || p.id === props.editingSale?.product_id,
  ),
)

const selectedProduct = computed(() =>
  props.products.find(p => p.id === selectedProductId.value) ?? null,
)

// Stock disponible considerando el modo edición: si estamos
// editando una venta y el producto seleccionado es el mismo que
// el de la venta original, las unidades de esa venta NO deben
// contar como "ya vendidas" — el usuario las está reasignando.
const availableStock = computed(() => {
  if (!selectedProduct.value) return 0
  const base = selectedProduct.value.available
  if (props.editingSale && props.editingSale.product_id === selectedProduct.value.id) {
    return base + props.editingSale.quantity
  }
  return base
})

const exceedsStock = computed(() =>
  !!quantity.value && !!selectedProduct.value && quantity.value > availableStock.value,
)

const saleTotal = computed(() => {
  if (!selectedProduct.value || !quantity.value) return 0
  return selectedProduct.value.selling_price * quantity.value
})

function resetForm() {
  selectedProductId.value = ''
  quantity.value = null
  buyerSelection.value = ''
  externalBuyerName.value = ''
}

// Pre-llena el formulario cuando entra en modo edición y se abre,
// o lo limpia cuando se cierra.
watch(() => props.visible, (open) => {
  if (!open) {
    resetForm()
    return
  }
  const sale = props.editingSale
  if (sale) {
    selectedProductId.value = sale.product_id
    quantity.value = sale.quantity
    if (sale.buyer_id) {
      buyerSelection.value = sale.buyer_id
      externalBuyerName.value = ''
    }
    else if (sale.buyer_name) {
      buyerSelection.value = '__other__'
      externalBuyerName.value = sale.buyer_name
    }
    else {
      buyerSelection.value = ''
      externalBuyerName.value = ''
    }
  }
})

async function handleSubmit() {
  if (!selectedProduct.value) return
  if (!quantity.value || quantity.value <= 0) return

  // REGLA DE NEGOCIO ESTRICTA: no se puede vender más que el stock disponible.
  if (quantity.value > availableStock.value) {
    toast.error(
      `Stock insuficiente. Solo quedan ${availableStock.value} unidades. `
      + 'Dile al Admin que registre más inventario.',
    )
    return
  }

  submitting.value = true

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    submitting.value = false
    toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
    return
  }

  // Decidir buyer_id / buyer_name según selección. El CHECK
  // `activity_sales_buyer_one_of` exige que solo uno tenga valor.
  let buyerId: string | null = null
  let buyerName: string | null = null
  if (buyerSelection.value === '__other__') {
    buyerName = externalBuyerName.value.trim() || null
  }
  else if (buyerSelection.value) {
    buyerId = buyerSelection.value
  }

  // total_price lo calcula el trigger set_sale_total_price tanto
  // en INSERT como en UPDATE.
  let error: { message: string } | null = null
  if (props.editingSale) {
    const res = await supabase
      .from('activity_sales')
      .update({
        product_id: selectedProduct.value.id,
        quantity: quantity.value,
        buyer_id: buyerId,
        buyer_name: buyerName,
      })
      .eq('id', props.editingSale.id)
    error = res.error
  }
  else {
    const res = await supabase.from('activity_sales').insert({
      activity_id: props.activityId,
      seller_id: user.id,
      product_id: selectedProduct.value.id,
      quantity: quantity.value,
      buyer_id: buyerId,
      buyer_name: buyerName,
    })
    error = res.error
  }

  submitting.value = false

  if (error) {
    toast.error(props.editingSale ? 'Error al actualizar la venta.' : 'Error al registrar la venta. Intenta de nuevo.')
    return
  }

  toast.success(props.editingSale ? 'Venta actualizada.' : 'Venta registrada correctamente.')
  emit('saved')
  emit('close')
}
</script>

<template>
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
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
      >
        <div class="absolute inset-0 bg-black/60" @click="emit('close')" />

        <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">{{ isEditing ? 'Editar Venta' : 'Nueva Venta' }}</h2>
            <button class="text-gray-500 hover:text-white transition" @click="emit('close')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div v-if="products.length === 0" class="text-center py-6">
            <p class="text-gray-400">No hay productos en el inventario.</p>
            <p class="text-sm text-gray-500 mt-1">Agrega productos antes de registrar ventas.</p>
          </div>

          <div v-else-if="availableProducts.length === 0" class="text-center py-6">
            <p class="text-gray-400">Todos los productos están agotados.</p>
            <p class="text-sm text-gray-500 mt-1">Pídele al comité que aumente el stock para seguir vendiendo.</p>
          </div>

          <form v-else class="space-y-5" @submit.prevent="handleSubmit">
            <div>
              <label for="sale-product" class="block text-sm font-medium text-gray-300 mb-1">
                Producto
              </label>
              <select
                id="sale-product"
                v-model="selectedProductId"
                required
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              >
                <option value="" disabled>Selecciona un producto</option>
                <option
                  v-for="product in availableProducts"
                  :key="product.id"
                  :value="product.id"
                >
                  {{ product.name }} — {{ formatCOP(product.selling_price) }} ({{ product.available }} disp.)
                </option>
              </select>
            </div>

            <div
              v-if="selectedProduct"
              class="rounded-lg px-4 py-3 flex items-center justify-between"
              :class="availableStock > 0
                ? 'bg-gray-800/50'
                : 'bg-red-500/10 border border-red-500/30'"
            >
              <span class="text-sm text-gray-400">Stock disponible</span>
              <span
                class="text-lg font-bold"
                :class="availableStock > 0 ? 'text-emerald-400' : 'text-red-400'"
              >
                {{ availableStock }} unidades
              </span>
            </div>

            <div>
              <label for="sale-quantity" class="block text-sm font-medium text-gray-300 mb-1">
                Cantidad
              </label>
              <input
                id="sale-quantity"
                v-model.number="quantity"
                type="number"
                required
                min="1"
                placeholder="1"
                class="w-full rounded-lg border bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:ring-1 outline-none transition"
                :class="exceedsStock
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:border-emerald-500 focus:ring-emerald-500'"
              />
              <p v-if="exceedsStock" class="text-xs text-red-400 mt-1">
                Solo quedan {{ availableStock }} unidades disponibles.
              </p>
            </div>

            <div>
              <label for="sale-buyer" class="block text-sm font-medium text-gray-300 mb-1">
                Comprador <span class="text-gray-500">(opcional)</span>
              </label>
              <select
                id="sale-buyer"
                v-model="buyerSelection"
                class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              >
                <option value="">Sin especificar</option>
                <option
                  v-for="member in members"
                  :key="member.id"
                  :value="member.id"
                >
                  {{ member.full_name }}
                </option>
                <option value="__other__">Otro (escribir nombre)</option>
              </select>
              <input
                v-if="buyerSelection === '__other__'"
                v-model="externalBuyerName"
                type="text"
                placeholder="Nombre del comprador externo"
                class="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div
              v-if="selectedProduct && quantity && quantity > 0"
              class="rounded-lg bg-gray-800/50 px-4 py-3 flex items-center justify-between"
            >
              <span class="text-sm text-gray-400">Total de la venta</span>
              <span class="text-sm font-semibold text-white">{{ formatCOP(saleTotal) }}</span>
            </div>

            <div class="flex gap-2 pt-2">
              <button
                type="button"
                class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
                @click="emit('close')"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="submitting || exceedsStock || availableStock <= 0"
                class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ submitting
                  ? (isEditing ? 'Guardando...' : 'Registrando...')
                  : (isEditing ? 'Guardar Cambios' : 'Registrar Venta') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
