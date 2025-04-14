<template>
  <div class="wallet-view">
    <div class="header">
      <h1>Solana 錢包管理</h1>
      <WalletConnect />
    </div>

    <template v-if="connected">
      <div class="dashboard">
        <WalletInfoCard
          ref="walletInfoCardRef"
          :publicKey="walletStore.publicKey"
          :connection="walletStore.connection"
        />

        <div class="actions-grid">
          <TransferSolCard @transaction-sent="refreshData" />

          <TokenListCard
            ref="tokenListCardRef"
            :publicKey="walletStore.publicKey"
            :connection="walletStore.connection"
          />

          <TransactionListCard
            ref="transactionListCardRef"
            :publicKey="walletStore.publicKey"
            :connection="walletStore.connection"
          />
        </div>
      </div>
    </template>

    <div v-else class="welcome-section">
      <h2>歡迎使用 Solana 錢包</h2>
      <p>請連接您的錢包以開始使用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import WalletConnect from '@/components/WalletConnect.vue'
import WalletInfoCard from '@/components/WalletInfoCard.vue'
import TransferSolCard from '@/components/TransferSolCard.vue'
import TokenListCard from '@/components/TokenListCard.vue'
import TransactionListCard from '@/components/RecentTransactionsCard.vue'
import { useWalletStore } from '@/stores/useWallet'

const walletStore = useWalletStore()
const walletInfoCardRef = ref()
const tokenListCardRef = ref()
const transactionListCardRef = ref()

const connected = computed(() => walletStore.connected)

const refreshData = async () => {
  // 使用 ref 來調用子組件的方法
  if (walletInfoCardRef.value) {
    await walletInfoCardRef.value.refreshBalance()
  }
  if (tokenListCardRef.value) {
    await tokenListCardRef.value.refresh()
  }
  if (transactionListCardRef.value) {
    await transactionListCardRef.value.refresh()
  }
}

// 監聽錢包連接狀態變化
// 不需要在這裡執行額外操作，因為各組件會自行處理其數據加載
watch(connected, async () => {
  // 連接狀態變化時，各組件會自動更新其數據
})
</script>

<style lang="scss" scoped>
.wallet-view {
  min-height: calc(100vh - 5rem);
  padding: 1rem;
  background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
  color: #e0e0e0;
  font-family: 'Roboto', sans-serif;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    padding: 2rem;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.5rem;

  @media (min-width: 768px) {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;

    @media (min-width: 768px) {
      font-size: 2.5rem;
    }
  }
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;

  @media (min-width: 768px) {
    gap: 2.5rem;
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  flex: 1;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2.5rem;
  }
}

.welcome-section {
  text-align: center;
  padding: 2rem 1rem;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  margin-top: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  @media (min-width: 768px) {
    padding: 4rem 2rem;
  }

  h2 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 1rem;

    @media (min-width: 768px) {
      font-size: 2.2rem;
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);

    @media (min-width: 768px) {
      font-size: 1.3rem;
    }
  }
}
</style>
