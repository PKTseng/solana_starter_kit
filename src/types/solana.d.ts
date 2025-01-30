// src/types/solana.d.ts
import { PublicKey, Transaction } from '@solana/web3.js'

interface Phantom {
  isPhantom?: boolean
  connect(): Promise<{ publicKey: PublicKey }>
  disconnect(): Promise<void>
  signTransaction(transaction: Transaction): Promise<Transaction>
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>
  signAndSendTransaction(transaction: Transaction, options?: any): Promise<{ signature: string }>
  request(params: any): Promise<any>
}

declare global {
  interface Window {
    solana?: Phantom
  }
}
