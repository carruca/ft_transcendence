<template>
  <div v-if="visible" class="modal" @click="handleBackgroundClick">
    <div ref="modalContent" class="modal-content" @click.stop>
      <h2>Join a Channel</h2>
      <div class="scrollable-content">
        <ul v-if="channels.length" class="channel-list">
          <li
              v-for="channel in channels"
              :key="channel.id"
              @click="attemptJoinChannel(channel)"
              :class="channelClass(channel)"
          >
            {{ channel.name }}
          </li>
        </ul>
        <div v-else>
          No more channels available
        </div>
      </div>
      <div class="buttons">
        <button @click="closeModal">Close</button>
      </div>
    </div>
  </div>
  <!-- PASSWORD PROMPT -->
  <div v-if="passwordRequired" class="password-modal" @click="handlePasswordBackgroundClick">
    <div class="password-content" @click.stop>
      <h3>Enter Password</h3>
      <div v-if="nameError" class="error-message">{{ nameError }}</div>
      <div class="input-group">
        <input type="password" v-model="channelPassword" placeholder="Enten password">
      </div>
      <div class="buttons">
        <button @click="cancelPasswordEntry">Cancel</button>
        <button @click="joinChannel">Confirm</button>
      </div>
    </div>
  </div>
  <!-- .PASSWORD PROMPT -->
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  visible: Boolean,
  channels: Array
});
const emit = defineEmits(['select', 'close']);

const modalContent = ref(null);

const selectedChannel = ref(null);
const passwordRequired = ref(false);
const channelPassword = ref('');

const nameError = ref('');

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

const handleBackgroundClick = (event) => {
  if (event.target.classList.contains('modal')) {
    closeModal();
  }
};
const handlePasswordBackgroundClick = (event) => {
  if (event.target.classList.contains('password-modal')) {
    cancelPasswordEntry();
  }
};

const attemptJoinChannel = (channel) => {
  if (channel.password) {
    selectedChannel.value = channel;
    passwordRequired.value = true;
  } else {
    emit('select', channel);
  }
};
const joinChannel = () => {
  let isValid = true;
  nameError.value = '';

  if (!channelPassword.value) {
    nameError.value = "Password is required";
    isValid = false;
  }

  if (isValid) {
    emit('select', { ...selectedChannel.value, hasPassword: passwordRequired.value, password: channelPassword.value });
    closeModal();
  }
};
const cancelPasswordEntry = () => {
  selectedChannel.value = null;
  passwordRequired.value = false;
  channelPassword.value = '';
  nameError.value = '';
};

const closeModal = () => {
  selectedChannel.value = null;
  passwordRequired.value = false;
  channelPassword.value = '';
  emit('close');
};

function channelClass(channel) {
  if (channel.password)
    return 'channel-passwd';
  return '';
}
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
  color: white;
  background-color: #272727;
  padding: 20px 20px 0 20px;
  border-radius: 5px;
  max-height: 80vh;
  width: 25vw;
}

.scrollable-content {
  overflow-y: auto;
  overflow-x: hidden;
}

.channel-list {
  /* Reuse the styles from your channel section list */
  list-style: none;
  padding: 0;
  margin: 0;
  color: white;
}

.channel-list li {
  cursor: pointer;
  padding: 0.5em;
  border-bottom: 1px solid #444;
  background-color: #272727;
}

.channel-list li:hover {
  background-color: #444;
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
.buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin: 0 0 10px 0;
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

.password-modal {
  position: fixed;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Dimmed background */
  z-index: 1010; /* Higher than the channel list modal */
  display: flex;
  justify-content: center;
  align-items: center;
}
.password-content {
  display: flex;
  flex-direction: column;
  padding: 0 20px 0 20px;
  color: white;
  background: #272727;
  border-radius: 5px;
  flex-direction: column;
}

.channel-passwd {
  color: #ff595e;
}
</style>
