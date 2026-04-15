<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

interface Article {
  id: string
  title: string
  summary: string
  body: string
}

const articles: Article[] = [
  {
    id: 'ingresos',
    title: 'Artículo I — Ingresos',
    summary: 'Requisitos y cuotas de admisión y reingreso al fondo.',
    body:
      'La admisión de un nuevo miembro al fondo tiene un costo de $70.000 COP, mientras que el reingreso de un miembro previamente retirado tiene un costo de $140.000 COP (el doble). ' +
      'Los nuevos integrantes a partir del año 2023 están exentos del pago de admisión. ' +
      'Todo aspirante deberá ser aceptado por la Junta Directiva y firmar conformidad con los presentes estatutos.',
  },
  {
    id: 'ahorros',
    title: 'Artículo II — Ahorros',
    summary: 'Cuotas mensuales obligatorias y fechas de pago.',
    body:
      'La cuota mínima mensual para menores de edad es de $100.000 COP, y para mayores de edad es de $120.000 COP. ' +
      'El valor del ahorro se define al ingresar al fondo y no puede modificarse durante todo el año en curso. ' +
      'El plazo máximo de pago es el día 30 de cada mes, con excepción del mes de diciembre, cuya fecha límite es el día 15.',
  },
  {
    id: 'prestamos',
    title: 'Artículo III — Préstamos',
    summary: 'Condiciones, tasas y requisitos de codeudores.',
    body:
      'Solo los miembros activos del fondo pueden solicitar préstamos. La tasa de interés mínima es del 2% mensual. ' +
      'Sin fiador, un miembro puede solicitar hasta $200.000 COP o el equivalente al 80% del valor ahorrado (lo que resulte menor). ' +
      'Para montos superiores, se requiere un codeudor que sea miembro activo del fondo y cuente con capacidad de ahorro suficiente para respaldar la obligación.',
  },
  {
    id: 'moras',
    title: 'Artículo IV — Moras y Sanciones',
    summary: 'Penalidades por incumplimiento y faltas.',
    body:
      'El atraso de tres cuotas consecutivas en el ahorro mensual genera la expulsión del fondo. ' +
      'La mora de dos meses en préstamos activa el descuento automático sobre los ahorros del deudor o, en su defecto, sobre los del codeudor. ' +
      'Llegar 15 minutos tarde a una citación genera una multa de $10.000 COP. La inasistencia a reuniones genera una multa de $30.000 COP que se descuenta directamente de los ahorros.',
  },
  {
    id: 'utilidades',
    title: 'Artículo V — Utilidades',
    summary: 'Reparto anual y causales de pérdida del derecho.',
    body:
      'A la primera oportunidad de incumplimiento en la fecha de pago del ahorro mensual, el miembro pierde todo derecho a las utilidades anuales del fondo. ' +
      'Al finalizar el año, se devuelven los aportes a cada miembro, dejando una base operativa de $300.000 COP en la caja del fondo para el siguiente período.',
  },
]

const openId = ref<string | null>('ingresos')

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Estatutos</h1>
      <p class="text-gray-400 mt-1">Normas y reglas que rigen el funcionamiento del fondo.</p>
    </div>

    <!-- Accordion -->
    <div class="space-y-3">
      <div
        v-for="article in articles"
        :key="article.id"
        class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden transition-all"
        :class="{ 'ring-1 ring-emerald-500/30': openId === article.id }"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-800/30 transition"
          @click="toggle(article.id)"
        >
          <div class="flex-1">
            <h3 class="text-base font-semibold text-white">{{ article.title }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ article.summary }}</p>
          </div>
          <svg
            class="w-5 h-5 text-gray-500 shrink-0 ml-4 transition-transform"
            :class="{ 'rotate-180': openId === article.id }"
            fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div v-if="openId === article.id" class="px-6 pb-6 border-t border-gray-800">
            <p class="text-sm text-gray-300 leading-relaxed pt-4">{{ article.body }}</p>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
