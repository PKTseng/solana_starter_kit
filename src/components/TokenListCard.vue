<template>
  <div class="action-card">
    <div class="card-header">
      <h3>代幣列表</h3>
      <button class="refresh-btn" @click="refresh" :disabled="loading">
        <span class="refresh-icon" :class="{ rotating: loading }">⟳</span>
      </button>
    </div>

    <div class="token-list">
      <div v-if="loading" class="empty-state">
        <div class="loading-spinner"></div>
        <p>載入中...</p>
      </div>
      <div v-else-if="error" class="empty-state error">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="refresh">重試</button>
      </div>
      <div v-else-if="tokens.length === 0" class="empty-state">
        <p>暫無代幣</p>
        <div class="help-text">
          <p>您正在連接到 Devnet。要獲取測試代幣，您可以：</p>
          <ol>
            <li>
              使用
              <a href="https://solfaucet.com/" target="_blank" rel="noopener noreferrer"
                >Solana Faucet</a
              >
              獲取測試 SOL
            </li>
            <li>
              使用<a href="https://spl-token-faucet.com/" target="_blank" rel="noopener noreferrer"
                >SPL 代幣水龍頭</a
              >創建測試代幣
            </li>
          </ol>
        </div>
      </div>
      <div v-else v-for="token in tokens" :key="token.mint" class="token-item">
        <div class="token-info">
          <div class="token-icon" :style="{ background: generateGradient(token.mint) }">
            {{ token.symbol.charAt(0) }}
          </div>
          <div class="token-details">
            <div class="token-name">{{ token.name }}</div>
            <div class="token-symbol">{{ token.symbol }}</div>
            <div class="token-mint">{{ shortenAddress(token.mint) }}</div>
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
const error = ref<string | null>(null)

// 生成漸變顏色
const generateGradient = (mintAddress: string) => {
  // 使用 mint 地址的前 6 位作為顏色
  const hash = mintAddress.slice(0, 6)
  const color1 = `#${hash.slice(0, 3)}`
  const color2 = `#${hash.slice(3, 6)}`
  return `linear-gradient(135deg, ${color1}, ${color2})`
}

// 縮短地址顯示
const shortenAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const fetchTokens = async () => {
  if (!props.publicKey || !props.connection) {
    error.value = '錢包未連接或連接未初始化'
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('開始獲取代幣賬戶，公鑰:', props.publicKey.toString())
    const connection = props.connection

    // 使用 RPC 調用獲取所有代幣賬戶
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      props.publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token 程序 ID
      },
      'confirmed',
    )

    console.log('獲取的代幣賬戶數量:', tokenAccounts?.value?.length || 0)

    // 如果沒有代幣賬戶，則返回空數組
    if (!tokenAccounts?.value || tokenAccounts.value.length === 0) {
      tokens.value = []
      loading.value = false
      return
    }

    // 處理代幣資訊
    const tokenData = await Promise.all(
      tokenAccounts.value.map(async (tokenAccount: any) => {
        try {
          const accountData = tokenAccount.account.data.parsed.info
          const mint = accountData.mint
          const balance = accountData.tokenAmount.uiAmount
          const decimals = accountData.tokenAmount.decimals

          // 確保我們只顯示有餘額的代幣 (過濾掉 0 餘額)
          if (balance === 0) {
            return null
          }

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
      }),
    )

    // 過濾掉處理失敗或餘額為 0 的代幣
    tokens.value = tokenData.filter((token) => token !== null) as Token[]
    console.log('處理後的代幣列表:', tokens.value)
  } catch (error: any) {
    console.error('獲取代幣列表失敗:', error)
    error.value = `獲取代幣列表失敗: ${error.message || '未知錯誤'}`
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
      error.value = null
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
      text-align: left;
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 8px;

      a {
        color: #14f195;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      ol {
        margin-top: 0.5rem;
        padding-left: 1.5rem;

        li {
          margin-bottom: 0.5rem;
        }
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

      .token-mint {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
        font-family: monospace;
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
