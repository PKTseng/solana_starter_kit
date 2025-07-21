<template>
  <div class="transfer-form">
    <input v-model="recipient" placeholder="Recipient address" class="transfer-input" :disabled="loading" />
    <input
      v-model="amount"
      type="number"
      placeholder="Amount in SOL"
      class="transfer-input"
      min="0"
      step="any"
      :disabled="loading"
    />

    <button :disabled="!isValid || loading" class="transfer-button" @click="sendSol">
      {{ loading ? 'Sending...' : 'Send SOL' }}
    </button>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Global Loading Component -->
    <LoadingOverlay :visible="showLoading" :title="loadingTitle" :status="loadingStatus" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'

import { useWalletStore } from '../stores/useWallet'
import LoadingOverlay from './LoadingOverlay.vue'

const emit = defineEmits<{
  'transaction-sent': []
}>()

const walletStore = useWalletStore()

const loading = ref(false)
const recipient = ref('')
const amount = ref('')
const errorMessage = ref('')

// Loading states
const showLoading = ref(false)
const loadingTitle = ref('Processing Transaction...')
const loadingStatus = ref('Preparing transaction')

const isValid = computed(() => {
  try {
    new PublicKey(recipient.value)
    return !!(recipient.value && +amount.value > 0)
  } catch {
    return false
  }
})

// Update loading status
const updateLoadingStatus = (status: string) => {
  loadingStatus.value = status
}

// Update loading title
const updateLoadingTitle = (title: string) => {
  loadingTitle.value = title
}

const sendSol = async () => {
  if (!walletStore.publicKey) {
    console.log('Wallet not connected')
    errorMessage.value = 'Wallet not connected'
    return
  }

  loading.value = true
  errorMessage.value = ''
  showLoading.value = true // Show loading
  updateLoadingStatus('Preparing transaction')

  try {
    console.log('Starting transaction process')

    // Check if Phantom wallet exists
    const { solana } = window
    if (!solana) {
      throw new Error('Phantom wallet extension not found')
    }

    console.log('Phantom wallet detected:', solana)

    // Create transaction
    const transaction = new Transaction()
    console.log('Transaction object created')

    // Set fee payer to sender's wallet
    transaction.feePayer = walletStore.publicKey

    // Get latest blockhash using connection from walletStore
    console.log('Fetching latest blockhash...')
    updateLoadingStatus('Getting network status...')

    const { blockhash, lastValidBlockHeight } = await walletStore.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    console.log('Successfully obtained blockhash:', blockhash)

    // Create receiver public key object
    const receiverPublicKey = new PublicKey(recipient.value)
    console.log('Receiver address:', recipient.value)

    // Add transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: walletStore.publicKey,
      toPubkey: receiverPublicKey,
      lamports: +amount.value * LAMPORTS_PER_SOL,
    })

    transaction.add(transferInstruction)
    console.log('Transfer instruction added, amount:', amount.value, 'SOL')

    console.log('Preparing wallet signature request...')
    updateLoadingStatus('Please confirm transaction in wallet...')

    // Use robust method to call signAndSendTransaction
    if (typeof solana.signAndSendTransaction !== 'function') {
      // If signAndSendTransaction doesn't exist, try alternative method
      console.log('signAndSendTransaction method not available, trying alternative')

      if (typeof solana.signTransaction === 'function') {
        // Sign first
        console.log('Attempting to use signTransaction')
        updateLoadingStatus('Waiting for wallet signature...')

        const signedTx = await solana.signTransaction(transaction)

        // Then send signed transaction
        updateLoadingStatus('Sending transaction to network...')
        const signature = await walletStore.connection.sendRawTransaction(signedTx.serialize())
        console.log('Transaction sent, signature:', signature)

        // Confirm transaction
        updateLoadingStatus('Waiting for network confirmation...')
        updateLoadingTitle('Confirming Transaction...')

        const confirmation = await walletStore.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        })

        console.log('Transaction confirmed:', confirmation)
        updateLoadingStatus('Transaction completed! Refreshing data...')

        console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)

        // Clear form after success
        recipient.value = ''
        amount.value = ''

        // Notify parent component transaction completed
        emit('transaction-sent')
        return
      } else {
        throw new Error('Wallet does not support required signing methods')
      }
    }

    // If signAndSendTransaction method exists, use it
    console.log('Calling signAndSendTransaction...')
    updateLoadingStatus('Waiting for wallet signature...')

    const signedTransaction = await solana.signAndSendTransaction(transaction)
    console.log('Transaction signed and sent:', signedTransaction)

    if (signedTransaction?.signature) {
      console.log('Transaction signature obtained:', signedTransaction.signature)
      updateLoadingStatus('Transaction sent, waiting for confirmation...')
      updateLoadingTitle('Confirming Transaction...')

      const confirmationStrategy = {
        signature: signedTransaction.signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      }

      // Use connection from walletStore to confirm transaction
      console.log('Waiting for transaction confirmation...')
      await walletStore.connection.confirmTransaction(confirmationStrategy)
      console.log('Transaction confirmed!')
      updateLoadingStatus('Transaction completed! Refreshing data...')

      console.log(`Transaction confirmed: https://explorer.solana.com/tx/${signedTransaction.signature}?cluster=devnet`)

      // Clear form after success
      recipient.value = ''
      amount.value = ''

      // Notify parent component transaction completed
      emit('transaction-sent')
    } else {
      throw new Error('Failed to obtain transaction signature')
    }
  } catch (error: any) {
    console.error('Error details:', error)
    errorMessage.value = `Transaction failed: ${error.message || 'Unknown error'}`
  } finally {
    loading.value = false
    // Wait a moment before hiding loading so user can see final status
    setTimeout(() => {
      showLoading.value = false
    }, 1000)
  }
}
</script>

<style lang="scss" scoped>
.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  position: relative;
}

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

  &:disabled {
    background-color: #f8fafc;
    color: #a0aec0;
    cursor: not-allowed;
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
  margin: 0 auto;
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

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  font-size: 0.875rem;
  text-align: center;
}
</style>
