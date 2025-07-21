import { defineStore } from 'pinia'
import { Connection, clusterApiUrl } from '@solana/web3.js'

export const useConnectionStore = defineStore('connection', {
  state: () => ({
    connection: new Connection(clusterApiUrl('devnet')),
  }),

  actions: {
    setConnection(connection: Connection) {
      this.connection = connection
    },
  },
})
