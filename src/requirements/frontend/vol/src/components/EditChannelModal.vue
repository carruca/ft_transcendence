<template>
  <div v-if="visible" class="modal" @click="handleBackgroundClick">
    <div class="modal-content" @click.stop>
      <h2>Edit a Channel</h2>
      <!-- CHANNEL PASSWORD -->
      <label for="channelPassword">Password:</label>
      <div class="checkbox-group">
        <input type="checkbox" id="hasPassword" v-model="hasPassword">
        <label for="hasPassword">Has password?</label>
      </div>
      <div v-if="hasPassword && passwordError" class="error-message">{{ passwordError }}</div>
      <div v-if="hasPassword" class="input-group">
        <input type="password" id="channelPassword" v-model="channelPassword" placeholder="Enter password">
      </div>
      <div class="buttons">
        <button @click="closeModal">Cancel</button>
        <button @click="confirmEdit">Confirm</button>
      </div>
      <!-- .CHANNEL PASSWORD -->
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  visible: Boolean,
});

const emit = defineEmits(['save', 'close']);

const channelPassword = ref('');
const hasPassword = ref(false);

const passwordError = ref('');

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeModal();
  } else if (event.key === 'Enter') {
    confirmEdit();
  }
};

const handleBackgroundClick = (event) => {
  if (event.target.classList.contains('modal')) {
    closeModal();
  }
};

const confirmEdit = () => {
  let isValid = true;
  passwordError.value = '';

  if (hasPassword.value && !channelPassword.value.trim()) {
    passwordError.value = "Password is required";
    isValid = false;
  }

  if (isValid) {
    if (!hasPassword.value)
      channelPassword.value = '';
    emit('save', {
      password: channelPassword.value,
      hasPassword: hasPassword.value });
    closeModal();
  }
};

const closeModal = () => {
  channelPassword.value = '';
  hasPassword.value = false;
  passwordError.value = '';
  emit('close');
};
</script>

<style scoped>
.modal {
  /* Modal styling */
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
  padding: 20px 20px 0 20px;
  border-radius: 5px;
  max-height: 80vh;
  width: 25vw;
}

.error-message {
  color: #ff595e;
}

.input-group {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.input-group input {
  flex-grow: 1;
  padding: 0.5em;
  color: white;
  background-color: #131313;
  border: 2px solid #444;
}

.label {
  display: block;
  margin-bottom: 5px;
}

.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.checkbox-group {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.checkbox-group input[type="checkbox"] {
  accent-color: #444; /* Color of the checkbox */
  margin-right: 10px;
}

.checkbox-group label {
  color: white;
  cursor: pointer;
}

.buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin: 10px 0 10px 0;
}
.buttons button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5em  1em;
  margin: 0.5em;
  cursor: pointer;
}
.buttons button:hover {
  background-color: #555;
}
</style>