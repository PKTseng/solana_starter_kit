<template>
  <div class="action-card">
    <div class="card-header">
      <h3>Recent Transactions</h3>
      <button class="refresh-btn" @click="refresh" :disabled="loading">
        <span class="refresh-icon" :class="{ rotating: loading }">⟳</span>
      </button>
    </div>

    <div class="transaction-list">
      <div v-if="loading" class="empty-state">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
      <div v-else-if="error" class="empty-state error">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="refresh">Retry</button>
      </div>
      <div v-else-if="transactions.length === 0" class="empty-state">
        <p>No transaction history</p>
        <div class="help-text">
          <p>You can create your first transaction using the "Send SOL" feature.</p>
          <p>All transactions on the Solana blockchain will appear here.</p>
        </div>
      </div>
      <div v-else v-for="tx in transactions" :key="tx.signature" class="transaction-item">
        <div class="tx-header">
          <div
            class="tx-type"
            :class="{
              'tx-received': tx.type === 'Received',
              'tx-sent': tx.type === 'Sent',
              'tx-other': tx.type === 'Other' || tx.type === 'Unknown',
            }"
          >
            {{ tx.type }}
          </div>
          <div class="tx-amount">{{ tx.amount }}</div>
        </div>
        <div class="tx-details">
          <div class="tx-time">{{ tx.time }}</div>
          <a
            :href="'https://explorer.solana.com/tx/' + tx.signature + '?cluster=devnet'"
            target="_blank"
            class="tx-link"
          >
            View Details
          </a>
        </div>
      </div>
    </div>

    <div v-if="transactions.length > 0" class="view-all">
      <a :href="'https://explorer.solana.com/address/' + publicKey?.toBase58() + '?cluster=devnet'" target="_blank">
        View All Transactions →
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import { LAMPORTS_PER_SOL, type PublicKey } from '@solana/web3.js'

import type { Transaction } from '../types/wallet'

const props = defineProps<{
  publicKey: PublicKey | null
  connection: any
}>()

const transactions = ref<Transaction[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchTransactions = async () => {
  if (!props.publicKey || !props.connection) {
    error.value = 'Wallet not connected or connection not initialized'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('Starting to fetch transaction history, public key:', props.publicKey.toString())

    // 使用 devnet 連接
    const connection = props.connection

    // 獲取地址的交易簽名
    const signatures = await connection.getSignaturesForAddress(
      props.publicKey,
      { limit: 10 }, // 限制返回的交易數量
    )

    console.log('Number of signatures retrieved:', signatures?.length || 0)

    if (!signatures || signatures.length === 0) {
      transactions.value = []
      loading.value = false
      return
    }

    // 獲取交易詳情
    const transactionDetails = await Promise.all(
      signatures.map(
        async (sig: {
          signature: string
          blockTime: number | null
          confirmationStatus: string | null
          memo?: string | null
        }) => {
          try {
            // 獲取完整交易信息
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            })

            // Calculate SOL amount (if it's a transfer transaction)
            let amount = 0
            let type = 'Unknown'

            if (tx && tx.meta && tx.meta.postBalances && tx.meta.preBalances) {
              // Find wallet index
              const accountKeys = tx.transaction.message.getAccountKeys({
                accountKeysFromLookups: tx.meta?.loadedAddresses,
              })
              const accountIndex = accountKeys.staticAccountKeys.findIndex(
                (pubkey: PublicKey) => pubkey.toString() === props.publicKey!.toString(),
              )

              if (accountIndex >= 0) {
                // Calculate balance change
                const balanceChange =
                  (tx.meta.postBalances[accountIndex] - tx.meta.preBalances[accountIndex]) / LAMPORTS_PER_SOL

                // Determine transaction type
                if (balanceChange > 0) {
                  type = 'Received'
                  amount = balanceChange
                } else if (balanceChange < 0) {
                  type = 'Sent'
                  amount = Math.abs(balanceChange)
                } else {
                  type = 'Other'
                }
              }
            }

            const txTime = sig.blockTime ? new Date(sig.blockTime * 1000) : new Date()

            return {
              signature: sig.signature,
              type,
              amount: amount ? `${amount.toFixed(6)} SOL` : '-',
              time: txTime.toLocaleString(),
              status: sig.confirmationStatus || 'confirmed',
              memo: sig.memo || '',
            }
          } catch (err) {
            console.error('Error fetching transaction details:', err)
            return {
              signature: sig.signature,
              type: 'Unknown',
              amount: '-',
              time: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Unknown time',
              status: 'Error',
              memo: '',
            }
          }
        },
      ),
    )

    transactions.value = transactionDetails
    console.log('Processed transaction history:', transactions.value)
  } catch (error: any) {
    console.error('Failed to fetch transaction history:', error)
    error.value = `Failed to fetch transaction history: ${error.message || 'Unknown error'}`
    transactions.value = []
  } finally {
    loading.value = false
  }
}

// Expose refresh method to external components
const refresh = async () => {
  await fetchTransactions()
}

// Watch for publicKey changes
watch(
  () => props.publicKey,
  async (newValue) => {
    if (newValue) {
      await fetchTransactions()
    } else {
      transactions.value = []
      error.value = null
    }
  },
)

// Fetch transaction history on initial mount
onMounted(async () => {
  if (props.publicKey) {
    await fetchTransactions()
  }
})

// Expose methods to parent component
defineExpose({
  refresh,
})
</script>

<style scoped>
.action-card {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 220px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.refresh-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.3rem;
}

.refresh-icon.rotating {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: rotate 1s linear infinite;
  margin-bottom: 0.5rem;
}

.transaction-list {
  max-height: 380px;
  overflow-y: auto;
  margin-top: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.empty-state.error {
  color: rgba(255, 100, 100, 0.8);
}

.help-text {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
}

.help-text p {
  margin: 0.5rem 0;
}

.retry-btn {
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.transaction-item {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.transaction-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tx-type {
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.tx-type.tx-received {
  background-color: rgba(0, 255, 0, 0.1);
  color: #4ade80;
}

.tx-type.tx-sent {
  background-color: rgba(255, 0, 0, 0.1);
  color: #f87171;
}

.tx-type.tx-other {
  background-color: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.tx-amount {
  font-family: monospace;
  font-weight: 600;
}

.tx-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.tx-link {
  color: #14f195;
  text-decoration: none;
  font-size: 0.8rem;
}

.tx-link:hover {
  text-decoration: underline;
}

.view-all {
  text-align: center;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.view-all a {
  color: #14f195;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.view-all a:hover {
  text-decoration: underline;
}
</style>
