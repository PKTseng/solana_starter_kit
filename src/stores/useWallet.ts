import { Connection, PublicKey } from '@solana/web3.js'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWalletStore = defineStore('wallet', () => {
  const connection = new Connection('https://api.devnet.solana.com')
  const publicKey = ref<PublicKey | null>(null)
  const connected = computed(() => publicKey.value !== null)

  const connectWallet = async () => {
    try {
      const { solana } = window

      if (!solana?.isPhantom) {
        throw new Error('Please install Phantom wallet')
      }

      const response = await solana.connect()
      publicKey.value = response.publicKey

      console.log(solana)
    } catch (error) {
      console.error(error)
    }
  }

  const disconnectWallet = async () => {
    try {
      const { solana } = window
      if (solana) {
        await solana.disconnect()
        publicKey.value = null
      }
    } catch (error) {
      console.log(error)
    }
  }

  return {
    connection,
    publicKey,
    connected,
    connectWallet,
    disconnectWallet,
  }
})
