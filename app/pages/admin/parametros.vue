<script setup lang="ts">
import type { FundSettings } from '~~/types/database'

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

/** Campos editables de `fund_settings` (sin `year` ni timestamps). */
type SettingsForm = Omit<FundSettings, 'year' | 'created_at' | 'updated_at'>

interface FieldDef {
  key: keyof SettingsForm
  label: string
  suffix: string
  hint?: string
  min: number
  max?: number
  step: number
}

interface FieldGroup {
  title: string
  iconPath: string
  fields: FieldDef[]
}

const fieldGroups: FieldGroup[] = [
  {
    title: 'Ahorros',
    iconPath: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    fields: [
      { key: 'min_savings_minor', label: 'Cuota mínima mensual — menores', suffix: 'COP', min: 0, step: 1 },
      { key: 'min_savings_adult', label: 'Cuota mínima mensual — mayores', suffix: 'COP', min: 0, step: 1 },
    ],
  },
  {
    title: 'Moras y Sanciones',
    iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
    fields: [
      { key: 'penalty_absence', label: 'Multa por inasistencia', suffix: 'COP', min: 0, step: 1 },
      { key: 'penalty_late_arrival', label: 'Multa por llegada tarde', suffix: 'COP', min: 0, step: 1 },
    ],
  },
  {
    title: 'Préstamos',
    iconPath: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    fields: [
      { key: 'min_interest_rate', label: 'Interés mínimo', suffix: '%', min: 0, step: 0.01 },
      { key: 'loan_limit_without_guarantor', label: 'Límite de préstamo sin fiador', suffix: 'COP', min: 0, step: 1 },
      { key: 'loan_savings_percentage_cap', label: 'Tope sin fiador (% del ahorro)', suffix: '%', min: 0, max: 100, step: 1 },
    ],
  },
  {
    title: 'Cierre Anual',
    iconPath: 'M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
    fields: [
      { key: 'year_end_base', label: 'Base retenida de fin de año', suffix: 'COP', min: 0, step: 1 },
    ],
  },
]

const supabase = useSupabase()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const availableYears = ref<number[]>([])
const selectedYear = ref<number>(new Date().getFullYear())
const updatedAt = ref<string | null>(null)
const form = ref<SettingsForm>(emptyForm())

/** `true` cuando el año seleccionado todavía no tiene fila en la BD. */
const isNewYear = computed(() => !availableYears.value.includes(selectedYear.value))

/** Años a mostrar en el selector: los configurados + el seleccionado. */
const yearOptions = computed(() => {
  const set = new Set(availableYears.value)
  set.add(selectedYear.value)
  return Array.from(set).sort((a, b) => b - a)
})

function emptyForm(): SettingsForm {
  return {
    min_savings_minor: 0,
    min_savings_adult: 0,
    penalty_absence: 0,
    penalty_late_arrival: 0,
    min_interest_rate: 2,
    loan_limit_without_guarantor: 0,
    loan_savings_percentage_cap: 80,
    year_end_base: 0,
  }
}

function rowToForm(row: FundSettings): SettingsForm {
  return {
    min_savings_minor: row.min_savings_minor,
    min_savings_adult: row.min_savings_adult,
    penalty_absence: row.penalty_absence,
    penalty_late_arrival: row.penalty_late_arrival,
    min_interest_rate: row.min_interest_rate,
    loan_limit_without_guarantor: row.loan_limit_without_guarantor,
    loan_savings_percentage_cap: row.loan_savings_percentage_cap,
    year_end_base: row.year_end_base,
  }
}

async function loadYears() {
  const { data } = await supabase
    .from('fund_settings')
    .select('year')
    .order('year', { ascending: false })

  availableYears.value = (data ?? []).map(r => r.year as number)
}

async function loadYear(year: number) {
  loading.value = true

  const { data } = await supabase
    .from('fund_settings')
    .select('*')
    .eq('year', year)
    .maybeSingle()

  if (data) {
    form.value = rowToForm(data as FundSettings)
    updatedAt.value = (data as FundSettings).updated_at
  }
  else {
    // Año nuevo: precargar con el año configurado más reciente como base.
    updatedAt.value = null
    const { data: latest } = await supabase
      .from('fund_settings')
      .select('*')
      .lt('year', year)
      .order('year', { ascending: false })
      .limit(1)
      .maybeSingle()

    form.value = latest ? rowToForm(latest as FundSettings) : emptyForm()
  }

  loading.value = false
}

function addNextYear() {
  const maxYear = availableYears.value.length
    ? Math.max(...availableYears.value)
    : new Date().getFullYear()
  selectedYear.value = maxYear + 1
  loadYear(selectedYear.value)
}

async function handleSave() {
  const hasEmpty = Object.values(form.value).some(
    v => v === null || v === undefined || Number.isNaN(v),
  )
  if (hasEmpty) {
    toast.error('Completa todos los campos antes de guardar.')
    return
  }

  saving.value = true

  const { error } = isNewYear.value
    ? await supabase.from('fund_settings').insert({ year: selectedYear.value, ...form.value })
    : await supabase.from('fund_settings').update(form.value).eq('year', selectedYear.value)

  saving.value = false

  if (error) {
    toast.error(`No se pudieron guardar los parámetros: ${error.message}`)
    return
  }

  toast.success(`Parámetros de ${selectedYear.value} guardados.`)
  // Invalida la caché compartida del composable para ese año.
  useFundSettings(selectedYear.value).refresh()
  await loadYears()
  await loadYear(selectedYear.value)
}

const updatedAtLabel = computed(() => {
  if (!updatedAt.value) return ''
  return new Date(updatedAt.value).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

onMounted(async () => {
  await loadYears()
  const currentYear = new Date().getFullYear()
  selectedYear.value = availableYears.value.includes(currentYear)
    ? currentYear
    : (availableYears.value[0] ?? currentYear)
  await loadYear(selectedYear.value)
})
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Parámetros del Fondo</h1>
      <p class="text-gray-400 mt-1">
        Valores configurables de los estatutos (cuotas, bases, límites, multas). Cada año
        tiene su propia configuración para preservar la integridad de los cálculos pasados.
      </p>
    </div>

    <!-- Barra de selección de año -->
    <div class="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Año a configurar</label>
          <select
            v-model.number="selectedYear"
            class="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            @change="loadYear(selectedYear)"
          >
            <option v-for="year in yearOptions" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
          @click="addNextYear"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Configurar año siguiente
        </button>

        <div class="flex-1" />

        <div class="text-right">
          <span
            class="inline-block px-2.5 py-1 text-xs font-semibold rounded-full"
            :class="isNewYear
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/20 text-emerald-400'"
          >
            {{ isNewYear ? 'Año nuevo' : 'Configuración existente' }}
          </span>
          <p v-if="updatedAtLabel" class="text-[11px] text-gray-500 mt-1">
            Última actualización: {{ updatedAtLabel }}
          </p>
        </div>
      </div>

      <!-- Aviso de año nuevo -->
      <div
        v-if="isNewYear && !loading"
        class="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400/90"
      >
        Estás configurando un año nuevo. Los valores se precargaron a partir del año
        configurado más reciente; ajústalos según los estatutos vigentes y guarda.
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse bg-gray-900 rounded-2xl h-56 border border-gray-800"
      />
    </div>

    <!-- Formulario por secciones -->
    <form v-else @submit.prevent="handleSave">
      <div class="space-y-6">
        <div
          v-for="group in fieldGroups"
          :key="group.title"
          class="bg-gray-900 rounded-2xl border border-gray-800 p-6"
        >
          <div class="flex items-center gap-3 mb-5">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" :d="group.iconPath" />
              </svg>
            </span>
            <h2 class="text-lg font-semibold text-white">{{ group.title }}</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div v-for="field in group.fields" :key="field.key">
              <label class="block text-sm font-medium text-gray-300 mb-1">
                {{ field.label }}
              </label>
              <div class="relative">
                <input
                  v-model.number="form[field.key]"
                  type="number"
                  required
                  :min="field.min"
                  :max="field.max"
                  :step="field.step"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 pl-4 pr-16 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                  {{ field.suffix }}
                </span>
              </div>
              <p v-if="field.hint" class="text-xs text-gray-500 mt-1">
                {{ field.hint }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Acción -->
      <div class="mt-6 flex items-center justify-end gap-3">
        <span v-if="isNewYear" class="text-xs text-gray-500">
          Se creará la configuración del año {{ selectedYear }}.
        </span>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-950 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Guardando...' : isNewYear ? `Crear parámetros ${selectedYear}` : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>
