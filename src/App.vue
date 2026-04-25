<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

// Garante que o tema é aplicado no elemento raiz antes do primeiro render,
// evitando o flash de tema errado (FOUT) ao recarregar a página
useTheme()
</script>

<template>
  <RouterView />
</template>