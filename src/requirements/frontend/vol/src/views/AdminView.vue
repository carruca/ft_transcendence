<template>
  <div class="admin-panel">
    <div class="header">
      <h1>{{ currentPanel }} Admin Panel</h1>
      <button @click="togglePanel" class="toggle-button">{{ toggleButtonText }}</button>
    </div>
    <div class="content">
      <div class="section channels">
        <h2>Channels</h2>
        <ul class="list">
          <li v-for="channel in channelList" :key="channel.uuid" @click="selectChannel(channel)" :class="{ selected: selectedChannelUUID === channel.uuid }">
            {{ channel.name }}
          </li>
        </ul>
      </div>
      <div class="section users">
        <h2>Users</h2>
        <ul class="list" v-if="selectedChannel">
          <li 
            v-for="user in selectedChannel.users.values()" 
            :key="user.uuid" 
            @click="selectUser(user)" 
            :class="{ selected: selectedUserUUID === user.uuid }">
            {{ user.name }}
          </li>
        </ul>
        <p v-else>No channel selected</p>
      </div>
      <div class="section actions">
        <h2>Channel Actions</h2>
        <div class="action-buttons">
          <button v-if="canShowAction('destroy')" @click="destroy">Destroy</button>
          <button v-if="canShowAction('passwd')" @click="passwd">Change password</button>
        </div>
        <h2>User Actions</h2>
        <div class="action-buttons">
          <button v-if="canShowAction('promote')" @click="promote">Promote</button>
          <button v-if="canShowAction('mute')" @click="mute">Mute</button>
          <button v-if="canShowAction('kick')" @click="kick">Kick</button>
          <button v-if="canShowAction('ban')" @click="ban">Ban</button>
        </div>
      </div>
    </div>
    <br>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { client } from '@/services/chat-client';

const selectedChannel = ref(null);
const selectedChannelUUID = ref(null);
const selectedUser = ref(null);
const selectedUserUUID = ref(null);
const currentPanel = ref('Chat');

// Destructure the properties and methods from the client you want to use
const { channelList } = client;

//const textColor = ref('');
//const backgroundColor = ref('');

onMounted(() => {
  client.playAdminSim(); // FIXME only for testing
  selectedChannelUUID.value = null;
  selectedUserUUID.value = null;
});

// Watch the channelList for changes
watch(channelList, (newChannelList) => {
  // Check if selectedChannel still exists in the updated channelList
  if (selectedChannel.value && !newChannelList.some(channel => channel.uuid === selectedChannel.value.uuid)) {
    selectedChannel.value = null;
    selectedChannelUUID.value = null;
    selectedUser.value = null;
    selectedUserUUID.value = null;
  }
});
// Watch the selectedChannel for changes to its user list
watch(
  () => selectedChannel.value ? Array.from(selectedChannel.value.users.values()) : [],
  (newUsersArray) => {
    // Check if selectedUser still exists in the updated users of selectedChannel
    if (selectedUser.value && !newUsersArray.some(user => user.uuid === selectedUser.value.uuid)) {
      // If not, reset selectedUser and selectedUserUUID
      selectedUser.value = null;
      selectedUserUUID.value = null;
    }
  },
  { deep: true }
);

// Functions to select channel and user
const selectChannel = (channel) => {
  selectedChannel.value = channel;
  selectedChannelUUID.value = channel.uuid;
  selectedUser.value = null;
  selectedUserUUID.value = null;
};
const selectUser = (user) => {
  selectedUser.value = user;
  selectedUserUUID.value = user.uuid;
}

// Toggle between Chat and Web Admin Panel
function togglePanel() {
  currentPanel.value = currentPanel.value === 'Chat' ? 'Web' : 'Chat';
}

// Computed property for toggle button text
const toggleButtonText = computed(() => currentPanel.value === 'Chat' ? 'Switch to Web' : 'Switch to Chat');

// Function to determine if an action can be shown
function canShowAction(action) {
  if (currentPanel.value === 'Chat') {
    if (selectedChannel.value) {
      if (selectedUser.value)
        return true;
      else if (action === 'destroy' || action === 'passwd')
        return true;
    }
  } else {
    return selectedChannel.value || selectedUser.value;
  }
}

// Example action functions
function promote() {
  alert(`Muting ${selectedUserUUID.value}`);
}
function mute() {
  alert(`Muting ${selectedUserUUID.value}`);
}
function kick() {
  alert(`Muting ${selectedUserUUID.value}`);
}
function ban() {
  alert(`Muting ${selectedUserUUID.value}`);
}
</script>

<style scoped>
.admin-panel {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
  width: 100vw; /* Full viewport width */
  margin: 20px;
  color: white;
  background-color: #333; /* Dark theme color */
  box-sizing: border-box;  /* Include padding and border in the element's total width and height */
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
  width: calc(100% - 40px);
  height: calc(100% - HeaderHeight);
  overflow: hidden;
}

.section {
  flex: 1; /* Each section takes equal width */
  display: flex;
  flex-direction: column;
  /* align-items: stretch; */
  padding: 0; /* Remove padding for full width */
  border-right: 2px solid #444; /* Maintain a border for separation */
  overflow-y: auto; /* Enable scrolling for each section */
}
.section:last-child {
  border-right: none; /* No border for the last section */
}

.list {
  flex-grow: 1;
  overflow-y: auto; /* Enables vertical scrolling */
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
  background-color: #5c5c5c;
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
