<template>
  <div class="action-card">
    <h3>轉帳 SOL</h3>
    <SendSol @transaction-sent="$emit('transaction-sent')" />
  </div>
</template>

<script setup lang="ts">
import SendSol from '@/components/SendSol.vue'

defineEmits<{
  'transaction-sent': []
}>()
</script>

<style lang="scss" scoped>
.action-card {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 220px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;

    @media (min-width: 768px) {
      font-size: 1.5rem;
    }
  }
}
</style>
