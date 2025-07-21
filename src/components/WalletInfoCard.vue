<template>
  <div class="wallet-info-card">
    <h2>Wallet Info</h2>
    <div class="info-content">
      <div class="address">
        <span>Wallet Address:</span>
        <span class="value copy" @click="copyAddress">{{ publicKey?.toBase58() }}</span>
      </div>
      <div class="balance">
        <span>SOL Balance:</span>
        <span class="value">{{ solBalance }} SOL</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

import { LAMPORTS_PER_SOL, type PublicKey } from '@solana/web3.js'

const props = defineProps<{
  publicKey: PublicKey | null
  connection: any // Use any type to avoid type mismatch issues
}>()

const solBalance = ref(0)

const copyAddress = () => {
  if (props.publicKey) {
    navigator.clipboard.writeText(props.publicKey.toBase58())
  }
}

// Watch for publicKey changes and fetch balance
watchEffect(async () => {
  if (props.publicKey) {
    try {
      const balance = await props.connection.getBalance(props.publicKey)
      solBalance.value = balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Error fetching balance:', error)
      solBalance.value = 0
    }
  } else {
    solBalance.value = 0
  }
})

// Expose refreshBalance method for manual balance refresh
const refreshBalance = async () => {
  if (props.publicKey) {
    try {
      const balance = await props.connection.getBalance(props.publicKey)
      solBalance.value = balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Error fetching balance:', error)
      solBalance.value = 0
    }
  }
}

// Expose refreshBalance method to parent component
defineExpose({
  refreshBalance,
})
</script>

<style lang="scss" scoped>
.wallet-info-card {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease;

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;

    @media (min-width: 768px) {
      font-size: 1.8rem;
    }
  }

  .info-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .address,
    .balance {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      font-size: 1rem;
      transition: background 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .copy {
        cursor: pointer;
        &:hover {
          color: #ecec51;
        }
      }

      .value {
        font-family: monospace;
        color: #fff;
        word-break: break-all;
      }
    }
  }
}
</style>
