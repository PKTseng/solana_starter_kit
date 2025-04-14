<template>
  <div class="action-card">
    <h3>代幣列表</h3>
    <div class="token-list">
      <div v-if="loading" class="empty-state">載入中...</div>
      <div v-else-if="tokens.length === 0" class="empty-state">暫無代幣</div>
      <div v-else v-for="token in tokens" :key="token.mint" class="token-item">
        <div class="token-info">
          <div class="token-icon">{{ token.symbol.charAt(0) }}</div>
          <div class="token-details">
            <div class="token-name">{{ token.name }}</div>
            <div class="token-symbol">{{ token.symbol }}</div>
          </div>
        </div>
        <div class="token-balance">{{ token.balance }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { PublicKey } from '@solana/web3.js'
import type { Token } from '../types/wallet'

const props = defineProps<{
  publicKey: PublicKey | null
  connection: any
}>()

const tokens = ref<Token[]>([])
const loading = ref(false)

const fetchTokens = async () => {
  if (!props.publicKey) return

  loading.value = true

  try {
    const connection = props.connection

    // 使用 RPC 調用獲取所有代幣賬戶
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      props.publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token 程序 ID
      },
      'confirmed',
    )

    console.log('獲取的代幣賬戶:', tokenAccounts)

    // 如果沒有代幣賬戶，則返回空數組
    if (tokenAccounts.value.length === 0) {
      tokens.value = []
      loading.value = false
      return
    }

    // 處理代幣資訊
    const tokenData = await Promise.all(
      tokenAccounts.value.map(
        async (tokenAccount: {
          account: {
            data: {
              parsed: {
                info: { mint: string; tokenAmount: { uiAmount: number; decimals: number } }
              }
            }
          }
        }) => {
          try {
            const accountData = tokenAccount.account.data.parsed.info
            const mint = accountData.mint
            const balance = accountData.tokenAmount.uiAmount
            const decimals = accountData.tokenAmount.decimals

            // 獲取代幣元數據 (如果可用)
            let name = `Unknown Token`
            let symbol = mint.substring(0, 4)

            try {
              // 嘗試從 Solana 上獲取代幣元數據
              const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(mint))
              if (tokenInfo.value?.data && 'parsed' in tokenInfo.value.data) {
                const parsedData = tokenInfo.value.data.parsed
                if (parsedData.info.mintAuthority) {
                  name = parsedData.info.name || name
                  symbol = parsedData.info.symbol || symbol
                }
              }
            } catch (error) {
              console.warn(`獲取代幣 ${mint} 元數據失敗:`, error)
            }

            return {
              mint,
              name,
              symbol,
              balance: balance.toLocaleString('en-US', {
                maximumFractionDigits: decimals,
              }),
              decimals,
            }
          } catch (err) {
            console.error(`處理代幣賬戶失敗:`, err)
            return null
          }
        },
      ),
    )

    // 過濾掉處理失敗的代幣
    tokens.value = tokenData.filter((token) => token !== null)
    console.log('處理後的代幣列表:', tokens.value)
  } catch (error) {
    console.error('獲取代幣列表失敗:', error)
    tokens.value = []
  } finally {
    loading.value = false
  }
}

// 對外暴露刷新方法
const refresh = async () => {
  await fetchTokens()
}

// 監聽 publicKey 的變化
watch(
  () => props.publicKey,
  async (newValue) => {
    if (newValue) {
      await fetchTokens()
    } else {
      tokens.value = []
    }
  },
)

// 初始化時獲取代幣列表
onMounted(async () => {
  if (props.publicKey) {
    await fetchTokens()
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

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;

    @media (min-width: 768px) {
      font-size: 1.5rem;
    }
  }
}

.token-list {
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
    color: rgba(255, 255, 255, 0.6);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.token-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .token-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .token-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #9945ff, #14f195);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1rem;
    }

    .token-details {
      display: flex;
      flex-direction: column;

      .token-name {
        font-weight: 600;
        font-size: 0.9rem;
      }

      .token-symbol {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .token-balance {
    font-family: monospace;
    font-weight: 600;
    font-size: 0.9rem;
  }
}
</style>
