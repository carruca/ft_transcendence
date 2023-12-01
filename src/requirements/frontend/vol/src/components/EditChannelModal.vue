<template>
  <div v-if="visible" class="modal" @click="handleBackgroundClick">
    <div class="modal-content" @click.stop>
      <h2>Edit a Channel</h2>
      <div class="content">
        <!-- CHANNEL PASSWORD -->
        <div class="section section-password">
          <h3>Channel properties</h3>
          <label for="channelPassword">Password:</label>
          <div class="checkbox-group">
            <input type="checkbox" id="hasPassword" v-model="hasPassword">
            <label for="hasPassword">Has password?</label>
          </div>
          <div v-if="hasPassword && passwordError" class="error-message">{{ passwordError }}</div>
          <div v-if="hasPassword" class="input-group">
            <input type="password" id="channelPassword" v-model="channelPassword" placeholder="Enter password">
          </div>
        </div>
        <!-- .CHANNEL PASSWORD -->
        <!-- CHANNEL BANNED USERS -->
        <div class="section section-bannedlist">
          <h3>Banned users</h3>
          <div class="scrollable-content">
            <div v-if="users && users.size" class="user-list">
              <div
                  v-for="user in Array.from(users.values())"
                  :key="user.id"
                  class="user"
              >
                <div class="user-info">
                  <span @click="userPm(user)">
                    {{ user.nickname }}
                  </span>
                </div>
                <div class="user-actions">
                  <div class="buttons">
                    <button @click="userView(user)">Profile</button>
                    <button @click="userUnban(user)">Unban</button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else>
              <p>No banned users</p>
            </div>
          </div>
        </div>
        <!-- .CHANNEL BANNED USERS -->
      </div>
      <div class="buttons">
        <button @click="closeModal">Close</button>
        <button @click="confirmEdit">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onBeforeUnmount, watch } from 'vue';
import router from '@/router';

const props = defineProps({
  visible: Boolean,
  users: Map
});

const emit = defineEmits(['save', 'close']);

const channelPassword = ref('');
const hasPassword = ref(false);

const passwordError = ref('');

watch(() => props.users, (newUsers) => {
  // Perform actions with newUsers, if necessary
  console.log('Users prop updated:', newUsers);
}, { deep: true });

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
    confirmEdit();
  }
};

const handleBackgroundClick = (event) => {
  if (event.target.classList.contains('modal')) {
    closeModal();
  }
};

const userPm = (user) => {
  emit('pm', user);
  closeModal();
};
const userView = (user) => {
  // FIXME fix user route
  router.push(`/${user.nickname}`);
};
const userUnban = (user) => {
  emit('unban', user);
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
  width: auto;
}

.content {
  display: flex;
  flex-grow: 1;
  box-sizing: border-box;
  overflow: hidden;
  justify-content: space-evenly;
}

.section {
  display: flex;
  flex-direction: column;
  flex: none;
  overflow: hidden;
  padding: 0 2.5em 0 2.5em;
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

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.user {
  display: flex;
  align-items: center;
  max-height: 5vh;
  overflow: hidden;
  padding: 0.5em;
  border-bottom: 1px solid #444;
  background-color: #272727;
}

.user-info {
  display: flex;
  flex-grow: 1;
  cursor: pointer;
  display: block;
  margin: 0 1em 0 1em;
}
.user-info:hover {
  text-decoration: underline;
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
