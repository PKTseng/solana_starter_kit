<template>
  <button v-if="!connected" class="connect-button" @click="connectWallet">Connect Wallet</button>

  <div v-else class="wallet-info">
    <span class="wallet-address">{{ shortAddress }}</span>
    <button class="disconnect-button" @click="disconnectedWallet">Disconnect Wallet</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWalletStore } from '../stores/useWallet.ts'

const walletStore = useWalletStore()

const connected = computed(() => walletStore.connected)

const shortAddress = computed(() => {
  if (!walletStore.publicKey) return ''

  const address = walletStore.publicKey.toString()
  return `${address.slice(0, 4)}...${address.slice(-4)}`
})

const connectWallet = () => walletStore.connectWallet()
const disconnectedWallet = () => walletStore.disconnectWallet()
</script>

<style lang="scss" scoped>
.connect-button,
.disconnect-button {
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  // &:hover {
  //   background-color: darken(#007bff, 10%);
  // }
}

.disconnect-button {
  background-color: #dc3545;

  // &:hover {
  //   background-color: (#dc3545, 10%);
  // }
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wallet-address {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}
</style>
