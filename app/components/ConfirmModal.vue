<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
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
        <div class="absolute inset-0 bg-black/60" @click="emit('cancel')" />

        <div class="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
          <div class="flex items-start gap-4 mb-5">
            <div
              class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
              :class="variant === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'"
            >
              <svg
                class="h-6 w-6"
                :class="variant === 'warning' ? 'text-yellow-400' : 'text-red-400'"
                fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold text-white">{{ title }}</h3>
              <p class="text-sm text-gray-400 mt-1">{{ message }}</p>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition"
              :disabled="loading"
              @click="emit('cancel')"
            >
              {{ cancelLabel ?? 'Cancelar' }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              :class="variant === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-500'
                : 'bg-red-600 hover:bg-red-500'"
              :disabled="loading"
              @click="emit('confirm')"
            >
              {{ loading ? 'Procesando...' : (confirmLabel ?? 'Eliminar') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
