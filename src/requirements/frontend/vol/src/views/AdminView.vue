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
          <li
            v-for="channel in channelList"
            :key="channel.uuid"
            @click="selectChannel(channel)"
            :class="[ channelClass(channel), { selected: selectedChannelUUID === channel.uuid }]">
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
            :class="[userClass(user), { selected: selectedUserUUID === user.uuid }]">
            {{ user.name }}
          </li>
        </ul>
        <p v-else>No channel selected</p>
      </div>
      <div class="section actions">
        <h2>Channel Actions</h2>
        <div class="action-buttons">
          <button v-if="canShowAction('destroy')" @click="destroy">Destroy</button>
          <button v-if="canShowAction('setpasswd')" @click="showPasswdModal = true">{{ passwdButtonText }}</button>
          <button v-if="canShowAction('delpasswd')" @click="delpasswd">Delete password</button>
        </div>
        <h2>User Actions</h2>
        <div class="action-buttons">
          <button v-if="canShowAction('promote')" @click="promote">{{ promoteButtonText }}</button>
          <button v-if="canShowAction('mute')" @click="mute">{{ muteButtonText }}</button>
          <button v-if="canShowAction('ban')" @click="ban">{{ banButtonText }}</button>
          <button v-if="canShowAction('kick')" @click="kick">Kick</button>
        </div>
      </div>
    </div>
    <div v-if="showPasswdModal" class="passwd-modal">
      <div class="passwd-modal-content">
        <h2>Enter password</h2>
        <input type="passwd" v-model="newPasswd" placeholder="Password (empty for none)" />
        <div class="action-buttons">
          <button @click="showPasswdModal = false">Cancel</button>
          <button @click="setpasswd">Confirm</button>
        </div>
      </div>
    </div>
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

const newPasswd = ref('');
const showPasswdModal = ref(false);

// Destructure the properties and methods from the client you want to use
const { channelList } = client;

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

// Computed properties for button text based on user properties
const banButtonText = computed(() => {
  return selectedUser.value && selectedUser.value.isBanned ? 'Unban' : 'Ban';
});
const muteButtonText = computed(() => {
  return selectedUser.value && selectedUser.value.isMuted ? 'Unmute' : 'Mute';
});
const promoteButtonText = computed(() => {
  return selectedUser.value && selectedUser.value.isAdmin ? 'Demote' : 'Promote';
});
const passwdButtonText = computed(() => {
  return selectedChannel.value && selectedChannel.value.hasPassword ? 'Change password' : 'Set password';
});

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

// Computed property for toggle button text
const toggleButtonText = computed(() => currentPanel.value === 'Chat' ? 'Switch to Web' : 'Switch to Chat');
function togglePanel() {
  currentPanel.value = currentPanel.value === 'Chat' ? 'Web' : 'Chat';
}

// User color
function channelClass(channel) {
  if (channel.hasPassword)
    return 'channel-passwd';
  return '';
}
function userClass(user) {
  if (user.isBanned) {
    return 'user-banned';
  /*} else if (user.isOwner) { TODO
    return 'user-owner';*/
  } else if (user.isAdmin) {
    return 'user-admin';
  } else if (user.isMuted) {
    return 'user-muted';
  }
  return '';
}

// Function to determine if an action can be shown
function canShowAction(action) {
  if (currentPanel.value === 'Chat') {
    if (selectedChannel.value) {
      if (action === 'destroy' || action === 'setpasswd')
        return true;
      if (action === 'delpasswd')
        return selectedChannel.value.hasPassword ? true : false;
      if (selectedUser.value) {
        if (selectedUser.value.isBanned)
          return action === 'ban';
        else
          return true;
      }
      return false;
    }
  } else {
    return selectedChannel.value || selectedUser.value;
  }
}

// Channel actions
function destroy() {
  client.close(selectedChannelUUID.value);
}
function setpasswd() {
  if (newPasswd.value) {
    client.password(selectedChannelUUID.value, newPasswd.value);
    newPasswd.value = ''; // Clear the password field
  }
  showPasswdModal = false; // Hide modal
}
function delpasswd() {
  client.password(selectedChannelUUID.value, "");
}
// User actions
function promote() {
  if (selectedUser.value && selectedUser.value.isAdmin)
    client.demote(selectedChannelUUID.value, selectedUserUUID.value);
  else
    client.promote(selectedChannelUUID.value, selectedUserUUID.value);
}
function mute() {
  if (selectedUser.value && selectedUser.value.isMuted)
    client.unmute(selectedChannelUUID.value, selectedUserUUID.value);
  else
    client.mute(selectedChannelUUID.value, selectedUserUUID.value);
}
function ban() {
  if (selectedUser.value && selectedUser.value.isBanned)
    client.unban(selectedChannelUUID.value, selectedUserUUID.value);
  else
    client.ban(selectedChannelUUID.value, selectedUserUUID.value);
}
function kick() {
  client.kick(selectedChannelUUID.value, selectedUserUUID.value);
}
</script>

<style scoped>
html, body {
  background: #131313;
}

.admin-panel {
  display: flex;
  flex-direction: column;
  height: 80vh; /* Full viewport height */
  width: 100vw; /* Full viewport width */
  justify-content: center; /* Center content vertically */
  margin: 20px;
  color: white;
  background-color: #131313;
  box-sizing: border-box;  /* Include padding and border in the element's total width and height */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  background-color: #131313; /* Slightly darker header background */
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
  width: 100%;
  justify-content: space-around; /* Space out the columns evenly */
  box-sizing: border-box; /* Ensure padding is included to the height calculated */
  overflow: hidden;
}

.section {
  display: flex;
  flex-direction: column;
  flex: 1; /* Each section takes equal width */
  border-right: 2px solid #444; /* Maintain a border for separation */
  overflow-y: auto; /* Enable scrolling for each section */
  margin-left: 10px;
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
  background-color: #444;
}

.list li.selected {
  background-color: #444;
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

.passwd-modal {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); /* Dimmed background */
  display: flex;
  justify-content: center;
  align-items: center;
}

.passwd-modal-content {
  background: #272727;
  padding: 20px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  gap: 10px; /* Spacing between elements */
}

.channel-passwd {
  color: #ffca3a;
}

.user-muted {
  color: #707070;
}
.user-banned {
  color: #ff595e;
}
.user-admin {
  color: #ffca3a;
}
.user-owner {
  color: #8ac926;
}
/* #ff595e #ffca3a #8ac926 #1982c4 #6a4c93 palette */
</style>
