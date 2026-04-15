<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: false,
})

await navigateTo('/dashboard', { replace: true })
</script>

<template>
  <div />
</template>
