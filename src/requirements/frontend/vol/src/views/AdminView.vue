<template>
  <div class="admin-panel">
    <div class="header">
      <h1>{{ currentPanel }} Admin Panel</h1>
      <button @click="togglePanel" class="toggle-button">{{ toggleButtonText }}</button>
    </div>
    <div class="content">
      <!-- CHAT ADMIN PANEL -->
      <div class="section channels" v-if="currentPanel === 'Chat'">
        <h2>Channels</h2>
        <div class="scrollable-content">
          <ul class="list">
            <li
              v-for="channel in adminChannelList"
              :key="channel.id"
              @click="selectChannel(channel)"
              :class="[ channelClass(channel), { selected: selectedChannelUUID === channel.id }]">
              {{ channel.name }}
            </li>
          </ul>
        </div>
      </div>
      <div class="section users" v-if="currentPanel === 'Chat'">
        <h2>Users</h2>
        <div class="scrollable-content">
          <ul class="list" v-if="selectedChannel">
            <li 
              v-for="user in selectedChannel.users.values()"
              :key="user.id"
              @click="selectUser(user)"
              :class="{ selected: selectedUserUUID === user.id }">
              <span :class="userStatus(user.user.status)">
                &#x2B24;
              </span>
              &nbsp;
              <span :class="userClass(user)">
                {{ user.nickname }}
                {{ user.isOwner ? '(owner)' : '' }}
                {{ user.isAdmin && !user.isOwner ? '(admin)' : '' }}
                {{ user.isMuted ? '(muted)' : '' }}
                {{ user.isBanned ? '(banned)' : '' }}
                {{ user.friend ? '(friend)' : '' }}
              </span>
            </li>
          </ul>
          <p v-else>No channel selected</p>
        </div>
      </div>
      <!-- .CHAT ADMIN PANEL -->
      <!-- WEB ADMIN PANEL -->
      <div class="section users" v-if="currentPanel === 'Web'">
        <h2>All Users</h2>
        <div class="scrollable-content">
          <ul class="list">
            <li
              v-for="user in allUsers"
              :key="user.id"
              @click="selectWebUser(user)"
              :class="{ selected: selectedUserUUID === user.id }">
              <span :class="userStatus(user.status)">
                &#x2B24;
              </span>
              &nbsp;
              <span :class="webuserClass(user)">
                {{ user.nickname }}
                {{ user.siteRole === UserSiteRoleEnum.OWNER ? '(owner)' : '' }}
                {{ user.siteRole === UserSiteRoleEnum.MODERATOR ? '(mod)' : '' }}
                {{ user.siteBanned ? '(banned)' : '' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div class="section users" v-if="currentPanel === 'Web'">
        <h2>Banned Users</h2>
        <div class="scrollable-content">
          <ul class="list">
            <li
              v-for="user in bannedUsers"
              :key="user.id"
              @click="selectWebUser(user)"
              :class="{ selected: selectedUserUUID === user.id }">
              <span :class="userStatus(user.status)">
                &#x2B24;
              </span>
              &nbsp;
              <span :class="webuserClass(user)">
                {{ user.nickname }}
                {{ user.siteRole === UserSiteRoleEnum.OWNER ? '(owner)' : '' }}
                {{ user.siteRole === UserSiteRoleEnum.MODERATOR ? '(mod)' : '' }}
                {{ user.siteBanned ? '(banned)' : '' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
      <!-- .WEB ADMIN PANEL -->
      <!-- CHAT ADMIN PANEL -->
      <div class="section actions" v-if="currentPanel === 'Chat'">
        <div class="scrollable-content">
          <h2>Channel Actions</h2>
          <div class="action-buttons">
            <button v-if="canShowAction('destroy')" @click="destroy">Destroy</button>
            <button v-if="canShowAction('edit')" @click="edit">{{ editButtonText }}</button>
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
      <!-- .CHAT ADMIN PANEL -->
      <!-- WEB ADMIN PANEL -->
      <div class="section actions" v-if="currentPanel === 'Web'">
        <div class="scrollable-content">
          <h2>Actions</h2>
          <div class="action-buttons">
            <button v-if="canShowAction('webban')" @click="webban">{{ webbanButtonText }}</button>
            <button v-if="canShowAction('webpromote')" @click="webpromote">{{ webpromoteButtonText }}</button>
          </div>
        </div>
      </div>
      <!-- .WEB ADMIN PANEL -->
    </div>
    <editChannelModal
      :visible="showEditModal"
      @pm="handleEditModalPm"
      @unban="handleEditModalUnban"
      @save="handleEditModalSave"
      @close="handleEditModalClose"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, defineProps } from 'vue';
import { client } from '@/services/chat-client';
import router from '@/router';

const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: false
  }
})

const selectedChannel = ref(null);
const selectedChannelUUID = ref(null);
const selectedUser = ref(null);
const selectedUserUUID = ref(null);
const currentPanel = ref('Chat');

// Modals
const showEditModal = ref(false);

// Destructure the properties and methods from the client you want to use
const { adminChannelList, adminUserList } = client;
import {
    UserSiteRoleEnum,
    UserStatusEnum,
} from '@/services/enum';
import { User } from '@/services/model';
import editChannelModal from '@/components/EditChannelModal.vue';

// Computed users and banned users array
const allUsers = computed(() => adminUserList.value.filter(u => !u.isBanned));
const bannedUsers = computed(() => adminUserList.value.filter(u => u.isBanned));

onMounted(() => {
  if (!props.user.admin)
    router.replace('/');
  selectedChannel.value = null;
  selectedChannelUUID.value = null;
  selectedUser.value = null;
  selectedUserUUID.value = null;
  client.adminWatch();
});

onUnmounted(() => {
  client.adminUnwatch();
})

// Watch the adminChannelList for changes
watch(adminChannelList, (newChannelList) => {
  // Check if selectedChannel still exists in the updated adminChannelList
  if (currentPanel.value != 'Chat')
    return;
  if (selectedChannel.value && !newChannelList.some(channel => channel.id === selectedChannel.value.id)) {
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
    if (currentPanel.value != 'Chat')
      return;
    if (selectedUser.value && !newUsersArray.some(user => user.id === selectedUser.value.id)) {
      selectedUser.value = null;
      selectedUserUUID.value = null;
    }
  },
  { deep: true }
);
// Watch the selectedUser for changes to the global user list
watch(adminUserList, (newUsers) => {
  // Check if selectedUser still exists in the updated users array
  if (currentPanel.value != 'Web')
    return;
  if (selectedUser.value && !newUsers.some(user => user.id === selectedUser.value.id)) {
    selectedUser.value = null;
    selectedUserUUID.value = null;
  }
});

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
const editButtonText = computed(() => {
  return 'Edit';
});
// Computed propertion for Web Admin button
const webbanButtonText = computed(() => {
  return selectedUser.value && selectedUser.value.isBanned ? 'Unban' : 'Ban';
});
const webpromoteButtonText = computed(() => {
  // TODO isModerator does not exist
  //return selectedUser.value && selectedUser.value.isModerator ? 'Demote' : 'Promote';
  return 'Promote (TODO)';
})

// Functions to select channel and user
const selectChannel = (channel) => {
  selectedChannel.value = channel;
  selectedChannelUUID.value = channel.id;
  selectedUser.value = null;
  selectedUserUUID.value = null;
};
const selectUser = (user) => {
  selectedUser.value = user;
  selectedUserUUID.value = user.id;
}

// Function to select web user
const selectWebUser = (user) => {
  selectedUser.value = user;
  selectedUserUUID.value = user.id;
}

// Computed property for toggle button text
const toggleButtonText = computed(() => currentPanel.value === 'Chat' ? 'Switch to Web' : 'Switch to Chat');
function togglePanel() {
  selectChannel.value = null;
  selectedChannelUUID.value = null;
  selectedUser.value = null;
  selectedUserUUID.value = null;
  currentPanel.value = currentPanel.value === 'Chat' ? 'Web' : 'Chat';
}

// Modals
const handleEditModalClick = () => {
  showEditModal.value = true;
};

const handleEditModalSave = (channelOptions) => {
  console.log(`Editing channel ${selectedChannel.value.name} with options: ${JSON.stringify(channelOptions)}`);
  if (channelOptions.hasPassword)
    client.password(selectedChannelUUID.value, channelOptions.password);
  else
    client.password(selectedChannelUUID.value, '');
  showEditModal.value = false;
};

const handleEditModalClose = () => {
  showEditModal.value = false;
};

const handleEditModalPm = (user) => {
  setCurrentPrivate(user.id);
  // TODO set pm logic
  router.push('/chat');
};
const handleEditModalUnban = (user) => {
  console.log(`Unbanning user '${user.name}'`)
  client.unban(selectedChannelUUID.value, user.id);
};

// User color
function channelClass(channel) {
  if (channel.hasPassword)
    return 'channel-passwd';
  return '';
}
function userClass(user) {
  if (user.isBanned)
    return 'user-banned';
  /*if (user.isOwner) TODO
    return 'user-owner';*/
  if (user.isAdmin)
    return 'user-admin';
  if (user.isMuted)
    return 'user-muted';
  return '';
}
function userStatus(status) {
  if (status === UserStatusEnum.ONLINE)
    return 'status-online';
  if (status === UserStatusEnum.INGAME)
    return 'status-dnd';
  if (status === UserStatusEnum.AWAY)
    return 'status-away';
  return 'status-offline';
}


// Web user color
function webuserClass(user) {
  if (user.isBanned) {
    return 'user-banned';
  /*} else if (user.isOwner) { TODO
    return 'user-owner';
  } else if (user.isModerator) {
    return 'user-admin';*/
  }
  // TODO maybe add colors for disabled users (?
  return '';
}

// Function to determine if an action can be shown
// TODO actions can't be done to owners
// TODO only owners can promote (both in the chat and in the site)
function canShowAction(action) {
  if (currentPanel.value === 'Chat') {
    if (selectedChannel.value) {
      if (action === 'destroy' || action === 'edit')
        return true;
      if (selectedUser.value) {
        if (selectedUser.value.isBanned)
          return action === 'ban';
        return true;
      }
      return false;
    }
  } else {
    if (selectedUser.value) {
      if (selectedUser.value.isBanned)
        return action === 'webban';
      return true;
    }
    return false;
  }
}

// Channel actions
function destroy() {
  client.close(selectedChannelUUID.value);
}
function edit() {
  handleEditModalClick();
}
// User actions
// TODO change function to working ones
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

// Web actions
// TODO change function to working ones
// TODO maybe more actions ?
function webban() {
  if (selectedUser.value && selectedUser.value.isBanned) {
    client.siteBan(selectedUser.value.id);
    alert('unban!');
  } else {
    client.siteUnban(selectedUser.value.id);
    alert('ban!');
  }
}
function webpromote() {
  // TODO isModerator does not exist
  /*if (selectedUser.value && selectedUser.value.isModerator)
    alert('Demote!');
  else
    alert('Promote!');*/
  alert('TODO!');
}
</script>

<style scoped>
html, body {
  background: #131313;
}

.admin-panel {
  display: flex;
  flex-direction: column;
  height: 100%; /* Full viewport height */
  width: 100%; /* Full viewport width */
  justify-content: center; /* Center content vertically */
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
  overflow: hidden;
}
.section:last-child {
  border-right: none; /* No border for the last section */
}

.section h2 {
  padding-left: 10px;
}
.section p {
  padding-left: 10px;
}

.scrollable-content {
  flex-grow: 1; /* Take up remaining space */
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Disable horizontal scrolling */
}

.list {
  flex-grow: 1;
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

.channel-passwd {
  color: #ff595e;
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

.status-online {
  color: #8ac926;
}
.status-dnd {
  color: #ff595e;
}
.status-away {
  color: #ffca3a;
}
.status-offline {
  color: #707070;
}
/* #ff595e #ffca3a #8ac926 #1982c4 #6a4c93 palette */
</style>
