<template>
  <div v-if="visible" class="modal" @click="handleBackgroundClick">
    <div class="modal-content" @click.stop>
      <h2>{{ title }}</h2>
      <label for="confirmAction">{{ text }}</label>
      <div class="buttons">
        <button @click="closeModal">Cancel</button>
        <button @click="confirmModal">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  visible: Boolean,
  title: String,
  text: String
});

const emit = defineEmits(['confirm', 'close']);

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event) => {
  if (!props.visible) return;
  if (event.key === 'Escape') {
    closeModal();
  } else if (event.key === 'Enter') {
    confirmModal();
  }
};

const handleBackgroundClick = (event) => {
  if (event.target.classList.contains('modal')) {
    closeModal();
  }
};

const closeModal = () => {
  emit('close');
};

const confirmModal = () => {
  emit('confirm');
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  display: flex;
  flex-direction: column;
  background-color: #272727;
  padding: 10px 20px 10px 20px;
  border-radius: 5px;
  max-height: 80vh;
  width: 35vw;
}

.buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;
}

.buttons button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5em 1em;
  margin: 0.5em;
  cursor: pointer;
}

.buttons button:hover {
  background-color: #555;
}
</style>
