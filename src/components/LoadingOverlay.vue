<template>
  <Teleport to="body">
    <div v-if="visible" class="loading-overlay" :class="{ show: visible }">
      <div class="loading-container">
        <div class="spinner-container">
          <div class="loading-spinner"></div>
        </div>
        <div class="loading-text">{{ title }}</div>
        <div class="loading-status">{{ status }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  title?: string
  status?: string
}>()
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(3px);

  &.show {
    opacity: 1;
  }
}

.loading-container {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 90%;
  width: 320px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.spinner-container {
  margin-bottom: 1.5rem;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #9945ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
}

.loading-status {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 250px;
  line-height: 1.5;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
