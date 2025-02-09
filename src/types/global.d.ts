declare global {
  interface Window {
    Buffer: typeof Buffer
    solana?: any
  }
}

export {}
