<template>
  <div class="transfer-form">
    <input v-model="recipient" placeholder="Recipient address" class="transfer-input" />
    <input
      v-model="amount"
      type="number"
      placeholder="Amount in SOL"
      class="transfer-input"
      min="0"
      step="any"
    />

    <button :disabled="!isValid" class="transfer-button" @click="sendSol">
      {{ loading ? 'Sending...' : 'Send SOL' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWalletStore } from '../stores/useWallet'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

const walletStore = useWalletStore()

const loading = ref(false)
const recipient = ref('')
const amount = ref('')

const isValid = computed(() => {
  try {
    new PublicKey(recipient.value)

    return !!(recipient.value && +amount.value > 0)
  } catch {
    return false
  }
})

const sendSol = async () => {
  if (!walletStore.publicKey) {
    console.log('wallet is not connect')
    return
  }

  loading.value = true
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletStore.publicKey,
        toPubkey: new PublicKey(recipient.value),
        lamports: +amount.value * LAMPORTS_PER_SOL,
      }),
    )

    const { solana } = window
    const signedTransaction = await solana?.signAndSendTransaction(transaction)

    if (signedTransaction?.signature) {
      const confirmationStrategy = {
        signature: signedTransaction.signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      }

      await walletStore.connection.confirmTransaction(confirmationStrategy)
    }

    recipient.value = ''
    amount.value = ''
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;

  .transfer-input {
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    color: #2d3748;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #9945ff;
      box-shadow: 0 0 0 3px rgba(153, 69, 255, 0.1);
    }

    &::placeholder {
      color: #a0aec0;
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
      background: #e2e8f0;
      color: #a0aec0;
      cursor: not-allowed;
      opacity: 0.7;
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
    }
  }
}
</style>
