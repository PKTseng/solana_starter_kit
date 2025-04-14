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

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
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
const errorMessage = ref('')

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
    console.log('錢包未連接')
    errorMessage.value = '錢包未連接'
    return
  }

  loading.value = true
  errorMessage.value = ''

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
    console.log('solana?.signAndSendTransaction 方法是否存在:', !!solana?.signAndSendTransaction)

    // 使用更健壯的方式調用 signAndSendTransaction
    if (typeof solana.signAndSendTransaction !== 'function') {
      // 如果 signAndSendTransaction 不存在，嘗試替代方法
      console.log('signAndSendTransaction 方法不存在，嘗試替代方法')

      if (typeof solana.signTransaction === 'function') {
        // 先簽名
        console.log('嘗試使用 signTransaction')
        const signedTx = await solana.signTransaction(transaction)

        // 然後發送已簽名的交易
        const signature = await walletStore.connection.sendRawTransaction(signedTx.serialize())
        console.log('交易已發送，簽名:', signature)

        // 確認交易
        const confirmation = await walletStore.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        })

        console.log('交易已確認:', confirmation)
        console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)

        // 成功後清空表單
        recipient.value = ''
        amount.value = ''
        return
      } else {
        throw new Error('錢包不支持所需的簽名方法')
      }
    }

    // 如果 signAndSendTransaction 方法存在，則使用它
    console.log('調用 signAndSendTransaction...')
    const signedTransaction = await solana.signAndSendTransaction(transaction)
    console.log('交易已簽名並發送:', signedTransaction)

    if (signedTransaction?.signature) {
      console.log('獲得交易簽名:', signedTransaction.signature)

      const confirmationStrategy = {
        signature: signedTransaction.signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!,
      }

      // 使用 walletStore 中的 connection 確認交易
      console.log('等待交易確認...')
      await walletStore.connection.confirmTransaction(confirmationStrategy)
      console.log('交易已確認!')

      console.log(
        `Transaction confirmed: https://explorer.solana.com/tx/${signedTransaction.signature}?cluster=devnet`,
      )

      // 成功後清空表單
      recipient.value = ''
      amount.value = ''
    } else {
      throw new Error('未能獲取交易簽名')
    }
  } catch (error: any) {
    console.error('錯誤詳情:', error)
    errorMessage.value = `交易失敗: ${error.message || '未知錯誤'}`
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

  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    font-size: 0.875rem;
    text-align: center;
  }
}
</style>
