export interface Token {
  mint: string
  name: string
  symbol: string
  balance: string
  decimals: number
  logo?: string
}

export interface Transaction {
  signature: string
  type: string
  amount: string
  time: string
  status: string
  memo?: string
}
