<script setup lang="ts">
interface AdminProfile {
  id: string
  full_name: string
  role: 'admin' | 'member'
  phone: string | null
  created_at: string
}

definePageMeta({
  middleware: 'admin',
  layout: 'default',
})

const supabase = useSupabase()
const toast = useToast()

const profiles = ref<AdminProfile[]>([])
const loading = ref(true)
const editing = ref<AdminProfile | null>(null)
const saving = ref(false)
const deleteTarget = ref<AdminProfile | null>(null)
const deleting = ref(false)

// Creación
interface NewMemberForm {
  email: string
  password: string
  full_name: string
  phone: string
  role: 'admin' | 'member'
}
const creating = ref<NewMemberForm | null>(null)
const creatingSubmitting = ref(false)

function openCreate() {
  creating.value = {
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'member',
  }
}

async function submitCreate() {
  if (!creating.value) return
  const form = creating.value

  if (form.password.length < 6) {
    toast.error('La contraseña debe tener al menos 6 caracteres.')
    return
  }

  creatingSubmitting.value = true

  // 1. Guardar la sesión del admin antes de crear el usuario (signUp la reemplaza).
  const { data: { session: adminSession } } = await supabase.auth.getSession()

  // 2. Crear el usuario en auth.users via signUp.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: form.email.trim(),
    password: form.password,
  })

  if (signUpError || !signUpData.user) {
    creatingSubmitting.value = false
    toast.error(`Error al crear el usuario: ${signUpError?.message ?? 'desconocido'}`)
    return
  }

  // 3. Insertar la fila en profiles (con la sesión del nuevo usuario — el insert policy lo permite).
  const { error: profileError } = await supabase.from('profiles').insert({
    id: signUpData.user.id,
    full_name: form.full_name.trim(),
    phone: form.phone.trim() || null,
    role: form.role,
  })

  // 4. Restaurar la sesión del admin sí o sí.
  if (adminSession) {
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    })
  }

  creatingSubmitting.value = false

  if (profileError) {
    toast.error(`Usuario creado pero falló el perfil: ${profileError.message}`)
    return
  }

  toast.success(`Miembro ${form.full_name} creado correctamente.`)
  creating.value = null
  await loadProfiles()
}

async function loadProfiles() {
  loading.value = true
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, created_at')
    .order('full_name')
  profiles.value = (data as AdminProfile[]) ?? []
  loading.value = false
}

function openEdit(p: AdminProfile) {
  editing.value = { ...p }
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  const p = editing.value
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: p.full_name,
      role: p.role,
      phone: p.phone || null,
    })
    .eq('id', p.id)
  saving.value = false
  if (error) {
    toast.error('Error al guardar el miembro.')
    return
  }
  toast.success('Miembro actualizado.')
  editing.value = null
  await loadProfiles()
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const { error } = await supabase.from('profiles').delete().eq('id', deleteTarget.value.id)
  deleting.value = false
  if (error) {
    toast.error(
      `No se pudo eliminar: ${error.message}. Revisa que no tenga aportes, préstamos, retiros o multas asociadas.`,
    )
    return
  }
  toast.success('Miembro eliminado.')
  deleteTarget.value = null
  await loadProfiles()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(loadProfiles)
</script>

<template>
  <div>
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Miembros</h1>
        <p class="text-gray-400 mt-1">Gestión de perfiles y roles del fondo.</p>
      </div>
      <button
        class="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
        @click="openCreate"
      >
        + Nuevo Miembro
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="animate-pulse bg-gray-900 rounded-xl h-16 border border-gray-800" />
    </div>

    <template v-else>
      <div
        v-if="profiles.length === 0"
        class="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center"
      >
        <p class="text-gray-400 text-lg">No hay miembros registrados.</p>
      </div>

      <div v-else class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-800">
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Nombre</th>
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Teléfono</th>
              <th class="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Rol</th>
              <th class="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Alta</th>
              <th class="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in profiles"
              :key="p.id"
              class="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition"
            >
              <td class="px-6 py-4"><span class="text-sm font-medium text-white">{{ p.full_name }}</span></td>
              <td class="px-6 py-4"><span class="text-sm text-gray-300">{{ p.phone ?? '—' }}</span></td>
              <td class="px-6 py-4 text-center">
                <span
                  class="px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="p.role === 'admin'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-blue-500/20 text-blue-400'"
                >
                  {{ p.role === 'admin' ? 'Administrador' : 'Miembro' }}
                </span>
              </td>
              <td class="px-6 py-4"><span class="text-sm text-gray-400">{{ formatDate(p.created_at) }}</span></td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="rounded-lg bg-gray-700 p-1.5 text-gray-300 hover:bg-gray-600 hover:text-white transition"
                    title="Editar"
                    @click="openEdit(p)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    class="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition"
                    title="Eliminar"
                    @click="deleteTarget = p"
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
            <h2 class="text-xl font-bold text-white mb-6">Editar Miembro</h2>
            <form class="space-y-4" @submit.prevent="saveEdit">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombre completo</label>
                <input
                  v-model="editing.full_name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                <input
                  v-model="editing.phone"
                  type="text"
                  placeholder="300 000 0000"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Rol</label>
                <select
                  v-model="editing.role"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
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

    <!-- Modal crear miembro -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="creating" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/60" @click="creating = null" />
          <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            <h2 class="text-xl font-bold text-white mb-6">Nuevo Miembro</h2>
            <form class="space-y-4" @submit.prevent="submitCreate">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Nombre completo</label>
                <input
                  v-model="creating.full_name"
                  type="text"
                  required
                  placeholder="María Pérez"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Correo electrónico</label>
                <input
                  v-model="creating.email"
                  type="email"
                  required
                  placeholder="maria@fodaf.local"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Contraseña inicial</label>
                <input
                  v-model="creating.password"
                  type="text"
                  required
                  minlength="6"
                  placeholder="mínimo 6 caracteres"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <p class="text-xs text-gray-500 mt-1">El miembro podrá cambiarla después desde su perfil.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                <input
                  v-model="creating.phone"
                  type="text"
                  placeholder="300 000 0000"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Rol</label>
                <select
                  v-model="creating.role"
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  :disabled="creatingSubmitting"
                  class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition disabled:opacity-50"
                  @click="creating = null"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="creatingSubmitting"
                  class="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {{ creatingSubmitting ? 'Creando...' : 'Crear Miembro' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmModal
      :visible="deleteTarget !== null"
      title="Eliminar miembro"
      :message="deleteTarget ? `¿Seguro que quieres eliminar a ${deleteTarget.full_name}? Fallará si tiene aportes, préstamos, retiros o multas asociadas.` : ''"
      :loading="deleting"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
