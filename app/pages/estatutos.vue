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
    id: 'ingreso',
    title: 'Artículo I — Ingreso y Admisión',
    summary: 'Solicitud, aprobación y cuotas de admisión y reingreso.',
    body:
      'Para ingresar al fondo se deberá presentar la solicitud ante la asamblea, la cual deberá ser aprobada mediante votación. ' +
      'El plazo máximo para ingresar al fondo es el 31 de enero del año en vigencia. ' +
      'Cada miembro nuevo aportará una admisión de ochenta mil pesos ($80.000 COP); los miembros que reingresan al año inmediatamente después de haber retirado su aporte pagarán el doble ($160.000 COP). ' +
      'Estos valores no serán devueltos a la salida final del miembro, sino que serán divididos proporcionalmente en partes iguales entre los integrantes activos al momento de la disolución del fondo.',
  },
  {
    id: 'ahorros',
    title: 'Artículo II — Ahorros',
    summary: 'Cuotas mínimas, definición del valor y fechas de pago.',
    body:
      'La cuota mínima de ahorro mensual es de cien mil pesos ($100.000 COP) para menores de edad y de ciento veinte mil pesos ($120.000 COP) para mayores de edad. ' +
      'Al ingresar al fondo, el valor del ahorro mensual queda definido con la realización del primer pago y no podrá ser modificado durante el año en curso. ' +
      'El plazo máximo para el pago de la cuota de enero es el 30 de enero. Desde febrero hasta diciembre, la cuota deberá efectuarse a más tardar el día 15 de cada mes; la cuota de diciembre queda sujeta a flexibilidad según la fecha de la reunión de fin de año. ' +
      'La cuota podrá pagarse de manera semanal, quincenal o en un solo pago mensual.',
  },
  {
    id: 'moras-ahorro',
    title: 'Artículo III — Moras en el Ahorro',
    summary: 'Atraso de cuotas, renegociación y expulsión.',
    body:
      'El miembro que incurra en el atraso de tres (3) cuotas será expulsado del fondo. ' +
      'No obstante, durante el primer mes de atraso tendrá derecho, por una única vez, a un proceso de renegociación: en primera instancia con el Comité y, de ser necesario, en segunda instancia con la Junta. ' +
      'Si no se logra un acuerdo en ninguna de estas instancias, el miembro será expulsado del fondo.',
  },
  {
    id: 'prestamos',
    title: 'Artículo IV — Préstamos',
    summary: 'Condiciones, límites, fiador y mora en créditos.',
    body:
      'El dinero del fondo solo y únicamente se puede prestar a sus miembros, con un interés no menor al dos por ciento (2%). ' +
      'El límite que se presta sin fiador es de quinientos mil pesos ($500.000 COP) o el 80% del valor ahorrado hasta el momento de la solicitud, lo que resulte menor. ' +
      'Para valores superiores se requiere un fiador perteneciente al fondo, y la capacidad de ambos deberá cubrir el valor del préstamo. ' +
      'Si el deudor queda en mora por dos (2) meses, automáticamente se le descontará el valor en mora de sus ahorros en el fondo; si sus ahorros no alcanzan, el descuento se aplicará sobre los ahorros del codeudor.',
  },
  {
    id: 'utilidades',
    title: 'Artículo V — Utilidades',
    summary: 'Reparto por préstamos, base de fin de año y pérdida del derecho.',
    body:
      'Las utilidades por préstamos serán divididas porcentualmente de acuerdo con el saldo que cada miembro tenga al cierre del año, siempre y cuando cumpla con la cuota de ahorro mensual a más tardar el día 15 del mes vigente. ' +
      'A la primera oportunidad en que se halle el incumplimiento del ahorro mensual en la fecha estipulada, el miembro perderá automáticamente todo derecho a dichas utilidades. ' +
      'Al final del año se devolverán los aportes, dejando todos los miembros una base de trescientos cincuenta mil pesos ($350.000 COP) de lo ahorrado. ' +
      'Las personas antiguas que se retiran pierden cualquier beneficio de antigüedad, adaptándose a los estatutos vigentes a su reingreso.',
  },
  {
    id: 'sanciones',
    title: 'Artículo VI — Sanciones y Asistencia',
    summary: 'Multas por inasistencia y retardo, y régimen de poderes.',
    body:
      'La sanción por inasistencia a las reuniones es de treinta mil pesos ($30.000 COP), descontada de los ahorros. ' +
      'Se autoriza un máximo de dos (2) poderes consecutivos de un mismo usuario y un máximo de tres (3) poderes por usuario en un año calendario; los poderes deben hacerse llegar a la presidencia del fondo con un plazo no menor a seis (6) horas previas al inicio de la reunión citada (Acta No. 6). ' +
      'El miembro que llegue después de quince (15) minutos de la hora estipulada a las citaciones —reuniones o actividades de integración— deberá pagar una multa de diez mil pesos ($10.000 COP). La aplicación y control de esta multa estará a cargo del Comité de Convivencia.',
  },
  {
    id: 'actividades-inversiones',
    title: 'Artículo VII — Actividades e Inversiones',
    summary: 'Comité de actividades e inversiones para ingresos adicionales.',
    body:
      'Habrá un comité de actividades cuyas condiciones se fijarán en la reunión de inicio de año, con el fin de generar ingresos adicionales y promover la integración de los miembros. Un caso especial de no participación será discutido por la Junta. ' +
      'Asimismo, el fondo realizará inversiones rentables cuyas condiciones serán definidas en la reunión de inicio de año y sometidas a votación, con el fin de generar ingresos adicionales.',
  },
  {
    id: 'junta',
    title: 'Artículo VIII — Junta Directiva',
    summary: 'Requisitos de antigüedad y criterios de elección.',
    body:
      'La Junta será elegida entre los miembros con una antigüedad de tres (3) años o más, considerando criterios personales específicos como su continuidad, el pago a tiempo de sus obligaciones y su buen comportamiento personal y crediticio.',
  },
  {
    id: 'retiros',
    title: 'Artículo IX — Retiro de Miembros Antiguos',
    summary: 'Devolución de dineros a asociados antiguos a 2022.',
    body:
      'A los asociados antiguos a 2022 que se retiren no se les retendrá ningún dinero de aportes ni de ahorros: se les devolverá todo el dinero que hayan allegado al fondo. ' +
      'Sin embargo, si el retiro ocurre en un mes diferente a diciembre, el miembro perderá el derecho a recibir utilidades por los préstamos y las actividades realizadas en el año calendario (Acta No. 9). ' +
      'Se exceptúa la entrega del dinero de la admisión para los nuevos integrantes que ingresan a partir de 2023.',
  },
]

const openId = ref<string | null>('ingreso')

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
