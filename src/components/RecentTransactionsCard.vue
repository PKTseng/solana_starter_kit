<template>
  <div class="action-card">
    <div class="card-header">
      <h3>最近交易</h3>
      <button class="refresh-btn" @click="refresh" :disabled="loading">
        <span class="refresh-icon" :class="{ rotating: loading }">⟳</span>
      </button>
    </div>

    <div class="transaction-list">
      <div v-if="loading" class="empty-state">
        <div class="loading-spinner"></div>
        <p>載入中...</p>
      </div>
      <div v-else-if="error" class="empty-state error">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="refresh">重試</button>
      </div>
      <div v-else-if="transactions.length === 0" class="empty-state">
        <p>暫無交易記錄</p>
        <div class="help-text">
          <p>您可以使用「轉帳 SOL」功能創建一筆新交易。</p>
          <p>所有在 Solana 區塊鏈上的交易都會顯示在這裡。</p>
        </div>
      </div>
      <div v-else v-for="tx in transactions" :key="tx.signature" class="transaction-item">
        <div class="tx-header">
          <div
            class="tx-type"
            :class="{
              'tx-received': tx.type === '收到',
              'tx-sent': tx.type === '發送',
              'tx-other': tx.type === '其他' || tx.type === 'Unknown',
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
            查看詳情
          </a>
        </div>
      </div>
    </div>

    <div v-if="transactions.length > 0" class="view-all">
      <a
        :href="'https://explorer.solana.com/address/' + publicKey?.toBase58() + '?cluster=devnet'"
        target="_blank"
      >
        查看所有交易 →
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
    error.value = '錢包未連接或連接未初始化'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('開始獲取交易記錄，公鑰:', props.publicKey.toString())

    // 使用 devnet 連接
    const connection = props.connection

    // 獲取地址的交易簽名
    const signatures = await connection.getSignaturesForAddress(
      props.publicKey,
      { limit: 10 }, // 限制返回的交易數量
    )

    console.log('獲取到的簽名數量:', signatures?.length || 0)

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

            // 計算 SOL 金額 (如果是轉帳交易)
            let amount = 0
            let type = 'Unknown'

            if (tx && tx.meta && tx.meta.postBalances && tx.meta.preBalances) {
              // 查找錢包的索引
              const accountKeys = tx.transaction.message.getAccountKeys({
                accountKeysFromLookups: tx.meta?.loadedAddresses,
              })
              const accountIndex = accountKeys.staticAccountKeys.findIndex(
                (pubkey: PublicKey) => pubkey.toString() === props.publicKey!.toString(),
              )

              if (accountIndex >= 0) {
                // 計算餘額變化
                const balanceChange =
                  (tx.meta.postBalances[accountIndex] - tx.meta.preBalances[accountIndex]) /
                  LAMPORTS_PER_SOL

                // 判斷交易類型
                if (balanceChange > 0) {
                  type = '收到'
                  amount = balanceChange
                } else if (balanceChange < 0) {
                  type = '發送'
                  amount = Math.abs(balanceChange)
                } else {
                  type = '其他'
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
            console.error('獲取交易詳情錯誤:', err)
            return {
              signature: sig.signature,
              type: 'Unknown',
              amount: '-',
              time: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : '未知時間',
              status: 'Error',
              memo: '',
            }
          }
        },
      ),
    )

    transactions.value = transactionDetails
    console.log('處理後的交易記錄:', transactions.value)
  } catch (error: any) {
    console.error('獲取交易記錄失敗:', error)
    error.value = `獲取交易記錄失敗: ${error.message || '未知錯誤'}`
    transactions.value = []
  } finally {
    loading.value = false
  }
}

// 對外暴露刷新方法
const refresh = async () => {
  await fetchTransactions()
}

// 監聽 publicKey 的變化
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

// 初始化時獲取交易記錄
onMounted(async () => {
  if (props.publicKey) {
    await fetchTransactions()
  }
})

// 暴露方法給父組件
defineExpose({
  refresh,
})
</script>

<style lang="scss" scoped>
.action-card {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 220px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;

    @media (min-width: 768px) {
      font-size: 1.5rem;
    }
  }
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
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.refresh-icon {
  font-size: 1.3rem;
  display: inline-block;
  transition: transform 0.3s ease;

  &.rotating {
    animation: rotate 1.5s linear infinite;
  }
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
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  padding-right: 0.5rem;
  margin-top: 1rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.7);
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &.error {
      color: rgba(255, 100, 100, 0.8);
    }

    .help-text {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 8px;

      p {
        margin: 0.5rem 0;
      }
    }
  }

  .retry-btn {
    margin-top: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.transaction-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:last-child {
    margin-bottom: 0;
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

    &.tx-received {
      background-color: rgba(0, 255, 0, 0.1);
      color: #4ade80;
    }

    &.tx-sent {
      background-color: rgba(255, 0, 0, 0.1);
      color: #f87171;
    }

    &.tx-other {
      background-color: rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
    }
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

    &:hover {
      text-decoration: underline;
    }
  }
}

.view-all {
  text-align: center;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  a {
    color: #14f195;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
