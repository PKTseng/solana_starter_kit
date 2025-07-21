import { defineStore } from 'pinia'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
  getMint,
} from '@solana/spl-token'
import { useWalletStore } from './useWallet'

export const useTokenStore = defineStore('token', {
  state: () => ({
    mintAddress: null as PublicKey | null,
    tokenAccount: null as PublicKey | null,
    decimals: 9,
  }),

  actions: {
    async createMint(connection: Connection) {
      try {
        const walletStore = useWalletStore()
        if (!walletStore.publicKey) throw new Error('Wallet not connected')
        const { solana } = window
        if (!solana) throw new Error('Phantom wallet not found')

        // 創建 Mint Account
        const mint = await createMint(
          connection,
          solana, // 支付手續費的錢包
          walletStore.publicKey, // Mint 的授權者
          walletStore.publicKey, // 凍結授權者
          this.decimals,
        )

        this.mintAddress = mint
        return mint
      } catch (error) {
        console.error('Error creating mint:', error)
        throw error
      }
    },

    async createTokenAccount(connection: Connection) {
      try {
        const walletStore = useWalletStore()
        if (!walletStore.publicKey || !this.mintAddress)
          throw new Error('Wallet not connected or mint not created')
        const { solana } = window
        if (!solana) throw new Error('Phantom wallet not found')

        // 創建或獲取關聯的 Token Account
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          solana, // 支付手續費的錢包
          this.mintAddress,
          walletStore.publicKey,
        )

        this.tokenAccount = tokenAccount.address
        return tokenAccount
      } catch (error) {
        console.error('Error creating token account:', error)
        throw error
      }
    },

    async mintTokens(connection: Connection, amount: number) {
      try {
        const walletStore = useWalletStore()
        if (!walletStore.publicKey || !this.mintAddress || !this.tokenAccount)
          throw new Error('Wallet not connected or accounts not created')
        const { solana } = window
        if (!solana) throw new Error('Phantom wallet not found')

        // 鑄造代幣到 Token Account
        const signature = await mintTo(
          connection,
          solana,
          this.mintAddress,
          this.tokenAccount,
          walletStore.publicKey,
          amount * Math.pow(10, this.decimals),
        )

        return signature
      } catch (error) {
        console.error('Error minting tokens:', error)
        throw error
      }
    },

    async transferTokens(connection: Connection, destination: PublicKey, amount: number) {
      try {
        const walletStore = useWalletStore()
        if (!walletStore.publicKey || !this.mintAddress || !this.tokenAccount)
          throw new Error('Wallet not connected or accounts not created')
        const { solana } = window
        if (!solana) throw new Error('Phantom wallet not found')

        // 獲取目標賬戶的 Token Account
        const destinationAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          solana,
          this.mintAddress,
          destination,
        )

        // 轉賬代幣
        const signature = await transfer(
          connection,
          solana,
          this.tokenAccount,
          destinationAccount.address,
          walletStore.publicKey,
          amount * Math.pow(10, this.decimals),
        )

        return signature
      } catch (error) {
        console.error('Error transferring tokens:', error)
        throw error
      }
    },

    async getTokenBalance(connection: Connection) {
      try {
        if (!this.tokenAccount) throw new Error('Token account not created')

        const account = await getAccount(connection, this.tokenAccount)
        return Number(account.amount) / Math.pow(10, this.decimals)
      } catch (error) {
        console.error('Error getting token balance:', error)
        throw error
      }
    },

    async getMintInfo(connection: Connection) {
      try {
        if (!this.mintAddress) throw new Error('Mint not created')

        const mintInfo = await getMint(connection, this.mintAddress)
        return {
          supply: Number(mintInfo.supply) / Math.pow(10, this.decimals),
          decimals: mintInfo.decimals,
          mintAuthority: mintInfo.mintAuthority,
          freezeAuthority: mintInfo.freezeAuthority,
        }
      } catch (error) {
        console.error('Error getting mint info:', error)
        throw error
      }
    },
  },
})
