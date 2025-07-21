<template>
  <div class="token-manager">
    <h2>SPL Token 管理</h2>

    <div class="section">
      <h3>Mint Account</h3>
      <div v-if="!mintAddress">
        <button @click="handleCreateMint" :disabled="isLoading">
          {{ isLoading ? '處理中...' : '創建 Mint Account' }}
        </button>
      </div>
      <div v-else>
        <p>Mint Address: {{ mintAddress.toString() }}</p>
        <div class="mint-info" v-if="mintInfo">
          <p>總供應量: {{ mintInfo.supply }}</p>
          <p>小數位數: {{ mintInfo.decimals }}</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Token Account</h3>
      <div v-if="!tokenAccount">
        <button @click="handleCreateTokenAccount" :disabled="isLoading || !mintAddress">
          {{ isLoading ? '處理中...' : '創建 Token Account' }}
        </button>
      </div>
      <div v-else>
        <p>Token Account: {{ tokenAccount.toString() }}</p>
        <p>餘額: {{ tokenBalance }}</p>
      </div>
    </div>

    <div class="section" v-if="tokenAccount">
      <h3>代幣操作</h3>
      <div class="mint-tokens">
        <input type="number" v-model="mintAmount" placeholder="鑄造數量" :disabled="isLoading" />
        <button @click="handleMintTokens" :disabled="isLoading || !mintAmount">
          {{ isLoading ? '處理中...' : '鑄造代幣' }}
        </button>
      </div>

      <div class="transfer-tokens">
        <input
          type="text"
          v-model="destinationAddress"
          placeholder="目標地址"
          :disabled="isLoading"
        />
        <input
          type="number"
          v-model="transferAmount"
          placeholder="轉賬數量"
          :disabled="isLoading"
        />
        <button
          @click="handleTransferTokens"
          :disabled="isLoading || !destinationAddress || !transferAmount"
        >
          {{ isLoading ? '處理中...' : '轉賬代幣' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTokenStore } from '../stores/tokenStore'
import { useConnectionStore } from '../stores/connectionStore'
import { PublicKey } from '@solana/web3.js'

interface MintInfo {
  supply: number
  decimals: number
  mintAuthority: PublicKey | null
  freezeAuthority: PublicKey | null
}

const tokenStore = useTokenStore()
const connectionStore = useConnectionStore()

const isLoading = ref(false)
const mintAmount = ref('')
const transferAmount = ref('')
const destinationAddress = ref('')
const tokenBalance = ref(0)
const mintInfo = ref<MintInfo | null>(null)

const mintAddress = computed(() => tokenStore.mintAddress)
const tokenAccount = computed(() => tokenStore.tokenAccount)

const handleCreateMint = async () => {
  try {
    isLoading.value = true
    await tokenStore.createMint(connectionStore.connection)
    await fetchMintInfo()
  } catch (error) {
    console.error('Error creating mint:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCreateTokenAccount = async () => {
  try {
    isLoading.value = true
    await tokenStore.createTokenAccount(connectionStore.connection)
    await fetchTokenBalance()
  } catch (error) {
    console.error('Error creating token account:', error)
  } finally {
    isLoading.value = false
  }
}

const handleMintTokens = async () => {
  try {
    isLoading.value = true
    const amount = parseFloat(mintAmount.value)
    if (isNaN(amount)) throw new Error('Invalid amount')

    await tokenStore.mintTokens(connectionStore.connection, amount)
    await fetchTokenBalance()
    mintAmount.value = ''
  } catch (error) {
    console.error('Error minting tokens:', error)
  } finally {
    isLoading.value = false
  }
}

const handleTransferTokens = async () => {
  try {
    isLoading.value = true
    const amount = parseFloat(transferAmount.value)
    if (isNaN(amount)) throw new Error('Invalid amount')

    const destination = new PublicKey(destinationAddress.value)
    await tokenStore.transferTokens(connectionStore.connection, destination, amount)
    await fetchTokenBalance()
    transferAmount.value = ''
    destinationAddress.value = ''
  } catch (error) {
    console.error('Error transferring tokens:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchTokenBalance = async () => {
  if (!tokenAccount.value) return
  try {
    tokenBalance.value = await tokenStore.getTokenBalance(connectionStore.connection)
  } catch (error) {
    console.error('Error fetching token balance:', error)
  }
}

const fetchMintInfo = async () => {
  if (!mintAddress.value) return
  try {
    mintInfo.value = await tokenStore.getMintInfo(connectionStore.connection)
  } catch (error) {
    console.error('Error fetching mint info:', error)
  }
}

onMounted(async () => {
  if (mintAddress.value) {
    await fetchMintInfo()
  }
  if (tokenAccount.value) {
    await fetchTokenBalance()
  }
})
</script>

<style scoped>
.token-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

h3 {
  margin-bottom: 15px;
  color: #666;
}

button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

input {
  padding: 8px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.mint-tokens,
.transfer-tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.mint-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
