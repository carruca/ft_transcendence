<template>
  <div class="admin-panel">
    <div class="header">
      <h1>{{ currentPanel }} TITLE</h1>
      <button @click="togglePanel">{{ toggleButtonText }}</button>
    </div>
    <div class="content">
      <div class="channels">
        <h2>Channels</h2>
        <ul class="list">
          <li v-for="channel in channels" :key="channel.id" @click="selectItem('channel', channel)">
            {{ channel.name }}
          </li>
        </ul>
      </div>
      <div class="users">
        <h2>Users</h2>
        <ul class="list">
          <li v-for="user in users" :key="user.id" @click="selectItem('user', user)">
            {{ user.name }}
          </li>
        </ul>
      </div>
      <div class="actions">
        <h2>Actions</h2>
        <button v-if="canShowAction('mute')" @click="mute">Mute</button>
        <button v-if="canShowAction('kick')" @click="kick">Kick</button>
        <!-- Add more actions as needed -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const channels = ref([
  { id: 1, name: 'General' },
  { id: 2, name: 'Support' },
  // More channels here
]);
const users = ref([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Bob 2' },
  { id: 4, name: 'Bob 3' },
  { id: 5, name: 'Bob 4' },
  { id: 6, name: 'Bob 5' },
  { id: 7, name: 'Bob 6' },
  { id: 8, name: 'Bob 7' },
  { id: 9, name: 'Bob 8' },
  { id: 10, name: 'Bob 9' },
  { id: 11, name: 'Bob 10' },
  { id: 12, name: 'Bob 11' },
  { id: 13, name: 'Bob 12' },
  { id: 14, name: 'Bob 13' },
  { id: 15, name: 'Bob 14' },
  // More users here
]);
const selectedChannel = ref(null);
const selectedUser = ref(null);
const currentPanel = ref('Web');

// Toggle between Chat and Web Admin Panel
function togglePanel() {
  currentPanel.value = currentPanel.value === 'Chat' ? 'Web' : 'Chat';
}

// Computed property for toggle button text
const toggleButtonText = computed(() => currentPanel.value === 'Chat' ? 'Switch to Web' : 'Switch to Chat');

// Function to select an item
function selectItem(type, item) {
  if (type === 'channel') {
    selectedChannel.value = item;
    if (currentPanel.value === 'Web') {
      selectedUser.value = null;
    }
  } else if (type === 'user') {
    selectedUser.value = item;
    if (currentPanel.value === 'Web') {
      selectedChannel.value = null;
    }
  }
}

// Function to determine if an action can be shown
function canShowAction(action) {
  if (currentPanel.value === 'Chat') {
    return selectedChannel.value && selectedUser.value;
  } else {
    return selectedChannel.value || selectedUser.value;
  }
}

// Example action functions
function mute() {
  // Muting logic
  alert(`Muting ${selectedUser.value.name}`);
}

function kick() {
  // Kick logic
  alert(`Kicking ${selectedUser.value.name}`);
}
</script>

<style scoped>
.admin-panel {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
}

.content {
  display: flex;
  height: 300px; /* Adjust as needed */
}

.content > div {
  flex: 1;
  border-right: 1px solid #ccc;
  padding: 1em;
  overflow-y: auto;
}

.content > div:last-child {
  border-right: none;
}

.list {
  list-style-type: none;
  padding: 0;
}

.list li {
  cursor: pointer;
  padding: 0.5em;
  border: 1px solid transparent;
}

.list li:hover {
  background-color: #f0f0f0;
}

.list li.selected {
  border-color: #007bff;
}
</style>
