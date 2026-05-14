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
    id: 'articulo-1',
    title: 'Artículo 1 — Ingreso al fondo',
    summary: 'Solicitud de ingreso aprobada por votación de la asamblea.',
    body:
      'Para ingresar al fondo deberá solicitar a la asamblea su petición, la cual deberá ser aprobada por medio de votación.',
  },
  {
    id: 'articulo-2',
    title: 'Artículo 2 — Plazo de ingreso',
    summary: 'Fecha límite para ingresar al fondo cada año.',
    body:
      'El plazo máximo para ingresar al fondo es el 31 de enero del año en vigencia.',
  },
  {
    id: 'articulo-3',
    title: 'Artículo 3 — Cuota de admisión y reingreso',
    summary: 'Valor de admisión, reingreso y destino del dinero.',
    body:
      'Cada miembro nuevo, para ingresar, aportará una admisión de ochenta mil pesos ($80.000) m/cte; y los miembros que reingresan al año inmediatamente de haberse retirado, su aporte será el doble de lo anteriormente estipulado. ' +
      'Estos valores no serán devueltos a su salida final del fondo, sino que serán proporcionalmente divididos en partes iguales entre los integrantes que estén activos en el momento de la disolución del fondo.',
  },
  {
    id: 'articulo-4',
    title: 'Artículo 4 — Cuota mínima de ahorro',
    summary: 'Monto mínimo mensual para menores y mayores de edad.',
    body:
      'La cuota mínima de ahorro mensual para menores de edad es de cien mil pesos m/cte ($100.000) y para mayores es de ciento veinte mil pesos m/cte ($120.000).',
  },
  {
    id: 'articulo-5',
    title: 'Artículo 5 — Fechas de pago de la cuota',
    summary: 'Plazos de pago mensual y modalidades.',
    body:
      'El plazo máximo para el pago de la cuota correspondiente al mes de enero será el 30 de enero. La cuota mensual de ahorro, desde febrero hasta diciembre, deberá efectuarse a más tardar el día 15 de cada mes; no obstante, la cuota del mes de diciembre quedará sujeta a flexibilidad, de acuerdo con la fecha de la reunión de fin de año. La cuota podrá pagarse de manera semanal, quincenal o en un solo pago mensual.',
  },
  {
    id: 'articulo-6',
    title: 'Artículo 6 — Atraso de cuotas',
    summary: 'Expulsión por mora y proceso de renegociación.',
    body:
      'El miembro que incurra en el atraso de tres (3) cuotas será expulsado del fondo. No obstante, durante el primer mes de atraso tendrá derecho, por una única vez, a un proceso de renegociación: en primera instancia con el Comité y, de ser necesario, en segunda instancia con la Junta. Si no se logra un acuerdo en ninguna de estas instancias, el miembro será expulsado del fondo.',
  },
  {
    id: 'articulo-7',
    title: 'Artículo 7 — Préstamos e interés',
    summary: 'El fondo solo presta a sus miembros, con interés mínimo.',
    body:
      'El dinero del fondo solo y únicamente se puede prestar a sus miembros, con un interés no menor al dos por ciento (2%).',
  },
  {
    id: 'articulo-8',
    title: 'Artículo 8 — Préstamos sin fiador',
    summary: 'Límite sin fiador y requisito de codeudor.',
    body:
      'El límite de dinero que se presta sin fiador es de quinientos mil pesos m/cte ($500.000) o el 80% del valor ahorrado hasta el momento en que se está solicitando el crédito. Para valores superiores se requiere un fiador perteneciente al fondo, y que la capacidad de ambos alcance para cubrir el valor del préstamo.',
  },
  {
    id: 'articulo-9',
    title: 'Artículo 9 — Mora en el pago de créditos',
    summary: 'Descuento automático de ahorros del deudor o codeudor.',
    body:
      'Sobre el pago de los créditos, si el deudor queda en mora por 2 meses, automáticamente se le descuenta el valor en mora de los ahorros que tenga en el fondo; y en dado caso que al deudor no le alcancen sus ahorros para pagar el crédito o lo que tenga en mora, automáticamente se les descontará a los ahorros del codeudor.',
  },
  {
    id: 'articulo-10',
    title: 'Artículo 10 — Utilidades por préstamos',
    summary: 'Reparto de utilidades y pérdida del derecho por incumplimiento.',
    body:
      'Las utilidades por préstamos serán divididas porcentualmente de acuerdo al saldo que tenga al cierre del año actual, siempre y cuando cumpla con la cuota de ahorro mensual máximo hasta el 15 del mes vigente, sujeto a lo establecido en el ítem 5 del presente estatuto. A la primera oportunidad en que se halle el incumplimiento del ahorro mensual en la fecha estipulada, automáticamente perderá todo derecho a dichas utilidades.',
  },
  {
    id: 'articulo-11',
    title: 'Artículo 11 — Cierre de año',
    summary: 'Devolución de aportes y base que queda en el fondo.',
    body:
      'Al final del año se devolverán los aportes, dejando todos los miembros una base de 350 mil de lo ahorrado. Las personas antiguas que se retiran pierden cualquier beneficio de antigüedad, adaptándose a los estatutos vigentes a su reingreso.',
  },
  {
    id: 'articulo-12',
    title: 'Artículo 12 — Comité de actividades',
    summary: 'Actividades para integración e ingresos adicionales.',
    body:
      'Habrá comité de actividades cuyas condiciones se fijarán en la reunión de inicio de año, con el fin de generar ingresos adicionales. Es importante reiterar que el fin de las actividades es la integración de los miembros, más que las utilidades del mismo. Cabe resaltar que, habiendo un caso especial de no participación, será discutido por la junta.',
  },
  {
    id: 'articulo-13',
    title: 'Artículo 13 — Sanción por inasistencia y poderes',
    summary: 'Multa por inasistencia a reuniones y régimen de poderes.',
    body:
      'El valor de la sanción por inasistencia a las reuniones es de treinta mil pesos ($30.000). Se autoriza un máximo de dos (2) poderes consecutivos de un mismo usuario y un máximo de tres (3) poderes por usuario en un año calendario. Los poderes se deben hacer llegar a la presidencia del fondo con un plazo no menor a seis (6) horas previas al inicio de la reunión citada (Acta No. 6). Este valor será descontado de los ahorros.',
  },
  {
    id: 'articulo-14',
    title: 'Artículo 14 — Retiro de asociados antiguos',
    summary: 'Devolución de dineros a asociados antiguos a 2022.',
    body:
      'A los asociados antiguos a 2022 que se retiren no se les retendrá ningún dinero de aportes ni de ahorros; se les devolverá todo el dinero que hayan allegado al fondo. Sin embargo, si se retira en un mes diferente al mes de diciembre, perderá el derecho a recibir utilidades por los préstamos y las actividades realizadas en el año calendario (Acta No. 9). Se exceptúa la entrega del dinero de la admisión para los nuevos integrantes que ingresan a partir del 2023.',
  },
  {
    id: 'articulo-15',
    title: 'Artículo 15 — Valor del ahorro mensual',
    summary: 'Definición e inmutabilidad del valor durante el año.',
    body:
      'Al ingresar al fondo, el valor del ahorro mensual quedará definido con la realización del primer pago de ahorro. Dicho valor será el monto que el miembro se compromete a ahorrar mensualmente y no podrá ser modificado durante el año en curso, sujeto a lo establecido en el ítem 6 del presente estatuto.',
  },
  {
    id: 'articulo-16',
    title: 'Artículo 16 — Elección de la Junta',
    summary: 'Antigüedad y criterios para integrar la Junta.',
    body:
      'La junta será elegida con miembros a partir de 3 años de antigüedad, con criterios personales específicos como su continuidad, pagos a tiempo y buen comportamiento personal y crediticio.',
  },
  {
    id: 'articulo-17',
    title: 'Artículo 17 — Sanción por llegada tarde',
    summary: 'Multa por llegar tarde a las citaciones.',
    body:
      'El miembro que llegue después de quince (15) minutos de la hora estipulada a las citaciones, ya sean reuniones o actividades de integración del fondo de ahorros familiar, deberá pagar una multa de diez mil pesos ($10.000). La aplicación y control de esta multa estará a cargo del Comité de Convivencia.',
  },
  {
    id: 'articulo-18',
    title: 'Artículo 18 — Inversiones del fondo',
    summary: 'Inversiones rentables aprobadas por votación.',
    body:
      'El fondo realizará inversiones rentables cuyas condiciones serán definidas en la reunión de inicio de año, con el fin de generar ingresos adicionales, las cuales serán sometidas a votación.',
  },
]

const openId = ref<string | null>('articulo-1')

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
