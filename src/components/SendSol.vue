<template>
  <div class="transfer-form">
    <input
      v-model="recipient"
      placeholder="Recipient address"
      class="transfer-input"
      :disabled="loading"
    />
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

    <!-- 使用全局 Loading 組件 -->
    <LoadingOverlay :visible="showLoading" :title="loadingTitle" :status="loadingStatus" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWalletStore } from '../stores/useWallet'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import LoadingOverlay from './LoadingOverlay.vue'

const emit = defineEmits<{
  'transaction-sent': []
}>()

const walletStore = useWalletStore()

const loading = ref(false)
const recipient = ref('')
const amount = ref('')
const errorMessage = ref('')

// Loading 狀態
const showLoading = ref(false)
const loadingTitle = ref('交易處理中...')
const loadingStatus = ref('準備交易中')

const isValid = computed(() => {
  try {
    new PublicKey(recipient.value)
    return !!(recipient.value && +amount.value > 0)
  } catch {
    return false
  }
})

// 更新載入狀態
const updateLoadingStatus = (status: string) => {
  loadingStatus.value = status
}

// 更新載入標題
const updateLoadingTitle = (title: string) => {
  loadingTitle.value = title
}

const sendSol = async () => {
  if (!walletStore.publicKey) {
    console.log('錢包未連接')
    errorMessage.value = '錢包未連接'
    return
  }

  loading.value = true
  errorMessage.value = ''
  showLoading.value = true // 顯示 loading
  updateLoadingStatus('準備交易中')

  try {
    console.log('開始交易流程')

    // 檢查 Phantom 錢包是否存在
    const { solana } = window
    if (!solana) {
      throw new Error('找不到 Phantom 錢包擴展程序')
    }

    console.log('檢測到 Phantom 錢包:', solana)

    // 建立交易
    const transaction = new Transaction()
    console.log('建立交易物件')

    // 設置費用支付者為發送者的錢包
    transaction.feePayer = walletStore.publicKey

    // 使用 walletStore 中的 connection 獲取最新的 blockhash
    console.log('正在獲取最新的 blockhash...')
    updateLoadingStatus('獲取網絡狀態...')

    const { blockhash, lastValidBlockHeight } = await walletStore.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    console.log('成功獲取 blockhash:', blockhash)

    // 創建接收方公鑰物件
    const receiverPublicKey = new PublicKey(recipient.value)
    console.log('接收方地址:', recipient.value)

    // 添加轉帳指令
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: walletStore.publicKey,
      toPubkey: receiverPublicKey,
      lamports: +amount.value * LAMPORTS_PER_SOL,
    })

    transaction.add(transferInstruction)
    console.log('已添加轉帳指令，金額:', amount.value, 'SOL')

    console.log('準備請求錢包簽名...')
    updateLoadingStatus('請在錢包中確認交易...')

    // 使用更健壯的方式調用 signAndSendTransaction
    if (typeof solana.signAndSendTransaction !== 'function') {
      // 如果 signAndSendTransaction 不存在，嘗試替代方法
      console.log('signAndSendTransaction 方法不存在，嘗試替代方法')

      if (typeof solana.signTransaction === 'function') {
        // 先簽名
        console.log('嘗試使用 signTransaction')
        updateLoadingStatus('等待錢包簽名...')

        const signedTx = await solana.signTransaction(transaction)

        // 然後發送已簽名的交易
        updateLoadingStatus('發送交易到網絡...')
        const signature = await walletStore.connection.sendRawTransaction(signedTx.serialize())
        console.log('交易已發送，簽名:', signature)

        // 確認交易
        updateLoadingStatus('等待網絡確認...')
        updateLoadingTitle('交易確認中...')

        const confirmation = await walletStore.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        })

        console.log('交易已確認:', confirmation)
        updateLoadingStatus('交易已完成！重新整理數據...')

        console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)

        // 成功後清空表單
        recipient.value = ''
        amount.value = ''

        // 通知父組件交易已完成
        emit('transaction-sent')
        return
      } else {
        throw new Error('錢包不支持所需的簽名方法')
      }
    }

    // 如果 signAndSendTransaction 方法存在，則使用它
    console.log('調用 signAndSendTransaction...')
    updateLoadingStatus('等待錢包簽名...')

    const signedTransaction = await solana.signAndSendTransaction(transaction)
    console.log('交易已簽名並發送:', signedTransaction)

    if (signedTransaction?.signature) {
      console.log('獲得交易簽名:', signedTransaction.signature)
      updateLoadingStatus('交易已發送，等待確認...')
      updateLoadingTitle('交易確認中...')

      const confirmationStrategy = {
        signature: signedTransaction.signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      }

      // 使用 walletStore 中的 connection 確認交易
      console.log('等待交易確認...')
      await walletStore.connection.confirmTransaction(confirmationStrategy)
      console.log('交易已確認!')
      updateLoadingStatus('交易已完成！重新整理數據...')

      console.log(
        `Transaction confirmed: https://explorer.solana.com/tx/${signedTransaction.signature}?cluster=devnet`,
      )

      // 成功後清空表單
      recipient.value = ''
      amount.value = ''

      // 通知父組件交易已完成
      emit('transaction-sent')
    } else {
      throw new Error('未能獲取交易簽名')
    }
  } catch (error: any) {
    console.error('錯誤詳情:', error)
    errorMessage.value = `交易失敗: ${error.message || '未知錯誤'}`
  } finally {
    loading.value = false
    // 等待一小段時間後隱藏 loading，以便用戶能夠看到最終狀態
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
  max-width: 400px;
  margin: 2rem auto;
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
