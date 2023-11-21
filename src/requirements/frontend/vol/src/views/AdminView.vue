<template>
  <div class="admin-panel">
    <div class="header">
      <h1>{{ currentPanel }} TITLE</h1>
      <button @click="togglePanel" class="toggle-button">{{ toggleButtonText }}</button>
    </div>
    <div class="content">
      <div class="section channels">
        <h2>Channels</h2>
        <ul class="list">
          <li v-for="channel in channels" :key="channel.id" @click="selectItem('channel', channel)" :class="{ selected: selectedChannel?.id === channel.id }">
            {{ channel.name }}
          </li>
        </ul>
      </div>
      <div class="section users">
        <h2>Users</h2>
        <ul class="list">
          <li v-for="user in users" :key="user.id" @click="selectItem('user', user)" :class="{ selected: selectedUser?.id === user.id }">
            {{ user.name }}
          </li>
        </ul>
      </div>
      <div class="section actions">
        <h2>Actions</h2>
        <div class="action-buttons">
          <button v-if="canShowAction('mute')" @click="mute">Mute</button>
          <button v-if="canShowAction('kick')" @click="kick">Kick</button>
        </div>
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
  height: 100vh; /* Full viewport height */
  width: 100vw; /* Full viewport width */
  color: white;
  background-color: #333; /* Dark theme color */
  margin: 0; /* Remove default margins */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  background-color: #222; /* Slightly darker header background */
}

.toggle-button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5em 1em;
  cursor: pointer;
}

.toggle-button:hover {
  background-color: #555;
}

.content {
  display: flex;
  flex-grow: 1; /* Take up remaining space */
  width: 100%; /* Use full width */
}

.section {
  flex: 1; /* Each section takes equal width */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0; /* Remove padding for full width */
  border-right: 1px solid #444; /* Maintain border for separation */
}

.section:last-child {
  border-right: none; /* No border for the last section */
}

.list {
  flex-grow: 1;
  overflow-y: auto;
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.list li {
  cursor: pointer;
  padding: 0.5em;
  border-bottom: 1px solid #444;
}

.list li:hover {
  background-color: #555;
}

.list li.selected {
  background-color: #007bff;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.action-buttons button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5em 1em;
  margin: 0.5em;
  cursor: pointer;
}

.action-buttons button:hover {
  background-color: #555;
}
</style>
