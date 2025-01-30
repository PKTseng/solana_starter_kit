<template>
  <WalletConnect />

  <template v-if="connected">
    <SendSol />
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWalletStore } from '../stores/useWallet'
import WalletConnect from '../components/WalletConnect.vue'
import SendSol from '@/components/SendSol.vue'

const walletStore = useWalletStore()

const connected = computed(() => walletStore.connected)
</script>

<style lang="scss" scoped></style>
