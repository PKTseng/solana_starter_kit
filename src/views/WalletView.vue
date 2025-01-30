<template>
  <div class="wallet-view">
    <WalletConnect />

    <template v-if="connected">
      <SendSol />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWalletStore } from '../stores/useWallet'
import WalletConnect from '../components/WalletConnect.vue'
import SendSol from '@/components/SendSol.vue'

const walletStore = useWalletStore()

const connected = computed(() => walletStore.connected)
</script>

<style lang="scss" scoped>
@use 'sass:color';

.wallet-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: #ffffff;
  font-family: 'Arial', sans-serif;

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

    &:hover {
      background-color: color.adjust(#007bff, $lightness: -10%);
    }
  }

  .disconnect-button {
    background-color: #dc3545;

    &:hover {
      background-color: color.adjust(#dc3545, $lightness: -10%);
    }
  }

  .wallet-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 2rem;

    .wallet-address {
      font-size: 16px;
      font-weight: bold;
      color: #ffffff;
    }
  }

  .transfer-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 400px;
    width: 100%;
    padding: 2rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);

    .transfer-input {
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      font-size: 1rem;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #9945ff;
        box-shadow: 0 0 0 3px rgba(153, 69, 255, 0.1);
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .transfer-button {
      padding: 1rem;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #9945ff, #8034db);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #8034db, #6a2bb8);
      }

      &:disabled {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.5);
        cursor: not-allowed;
        opacity: 0.7;
      }

      &:active:not(:disabled) {
        transform: translateY(1px);
      }
    }
  }
}
</style>
