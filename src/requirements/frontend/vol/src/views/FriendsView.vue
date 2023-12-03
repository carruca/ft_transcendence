<template>
  <div v-if="isLoading">
    <p>Loading friends...</p>
  </div>
  <div v-else class="friends-view">
    <div class="content">
      <div class="section friends-section">
        <div class="section-header">
          <h2>Friends</h2>
          <div class="tabs">
            <div class="buttons">
              <button
                  v-for="tab in tabs"
                  :key="tab"
                  @click="selectedTab = tab"
                  :class="{ active: selectedTab === tab }"
              >
                {{ tab }}
              </button>
            </div>
          </div>
        </div>
        <div class="scrollable-content">
          <div class="friends-list">
            <div v-if="getSelectedTabList().length === 0">
              <p>{{ getSelectedTabEmptyText() }}</p>
            </div>
            <div v-else class="list">
              <div v-for="user in getSelectedTabList()"
                  :key="user.id"
                  class="user"
              >
                <div class="user-picture">
                  <img :src="user.userProfile" alt="Profile picture" class="friend-image">
                </div>
                <div class="user-info"
                    @click="handleUserClick(user.nickname)">
                  <h4>{{ user.nickname }}</h4>
                </div>
                <div class="user-status" v-if="user.relationStatus !== RelationStatusEnum.BLOCKED">
                  <h3>{{ connectionStatus[user.userStatus] }}</h3>
                </div>
                <div class="user-actions">
                  <friendsBotton :users="[me.id, user.id]"></friendsBotton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import router from '@/router';
import md5 from 'md5';

import friendsBotton from '@/components/Profile/friendsBotton.vue';
import { connectionStatus } from '@/components/Profile/ConnectionStatus';
import { UserStatusEnum } from '@/services/enum';
import { RelationUser, RelationStatusEnum } from '@/services/model';

import { socket } from '@/services/ws';

import { ChatClient } from '@/services/chat-client';

const client = ChatClient.getInstance();

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});
const me = props.user;

const isLoading = ref(true);

const selectedTab = ref('Online');
const tabs = ['Online', 'All', 'Pending', 'Blocked'];

const usersList = ref([]);

const allUsers = computed(() => usersList.value.filter(user => user.relationStatus === RelationStatusEnum.ACCEPTED));
const onlineUsers = computed(() => usersList.value.filter(user => user.relationStatus === RelationStatusEnum.ACCEPTED && user.userStatus === UserStatusEnum.ONLINE));;
const pendingUsers = computed(() => usersList.value.filter(user => user.relationStatus === RelationStatusEnum.PENDING));
const blockedUsers = computed(() => usersList.value.filter(user => user.relationStatus === RelationStatusEnum.BLOCKED));

onMounted(async () => {
  isLoading.value = true;
  const friendsList = await fetchFriends();
  const blocksList = await fetchBlocks();

  //console.log(`friendsList: ${JSON.stringify(friendsList)}`);
  //console.log(`blocksList: ${JSON.stringify(blocksList)}`);
  usersList.value = [...friendsList, ...blocksList];

  isLoading.value = false;

  socket.on('userUpdated', handleUserChange);
  client.userWatch(usersList.value.map(user => user.id));
});

onBeforeUnmount(() => {
  client.userUnwatch(usersList.value.map(user => user.id));
  socket.off('userUpdated', handleUserChange);
});

const handleUserChange = (responseJSON) => {
  const userDTO = JSON.parse(responseJSON);

  const userIndex = usersList.value.findIndex(user => user.id === userDTO.sourceUserId);
  if (userIndex !== -1) {
    if (userDTO.changes.status != undefined) {
      usersList.value[userIndex].userStatus = userDTO.changes.status;
    }

    /*if (userDTO.nickname !== user.nickname) {
      user.nickname = userDTO.nickname;
      user.userProfile = getProfilePictureUrl(userDTO.nickname, userDTO.login);
    }

    if (userDTO.blocked) {
      user.relationStatus = RelationStatusEnum.BLOCKED;
    } else if (userDTO.friend) {
      user.relationStatus = RelationStatusEnum.ACCEPTED;
    } else if (user.relationStatus !== RelationStatusEnum.PENDING) {
      client.userUnwatch([user.id]);
      usersList.value.splice(userIndex, 1);
    }

    usersList.value = [...usersList.value];*/
  }

  console.log("usersList: " + JSON.stringify(usersList.value));
};

function getSelectedTabList() {
  switch (selectedTab.value) {
    case 'All':
      return allUsers.value;
    case 'Online':
      return onlineUsers.value;
    case 'Pending':
      return pendingUsers.value;
    case 'Blocked':
      return blockedUsers.value;
    default:
      return [];
  }
}
function getSelectedTabEmptyText() {
  switch (selectedTab.value) {
    case 'All':
      return 'You have no friends yet.';
    case 'Online':
      return 'None of your friends are online.';
    case 'Pending':
      return 'You have no pending friend requests.';
    case 'Blocked':
      return 'You have no blocked users.';
    default:
      return '';
  }
}

function handleUserClick(nickname: string) {
  router.push(`/profile/${nickname}`)
};

// Function to fetch friends data
async function fetchFriends(): Promise<RelationUser[]> {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${me.id}/friends`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error('Failed to fetch friends');
    }
    let data = await response.json();
    console.log(`FRIEND data: ${JSON.stringify(data)}`);
    return await Promise.all(data.map(async (item) => {
      const userProfile = await getProfilePictureUrl(item.user[0].nickname, item.user[0].login);
      const userStatus = new RelationUser(item.user[0], item.status);
      userStatus.userProfile = userProfile;
      return userStatus;
    }));
  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
}
async function fetchBlocks(): Promise<RelationUser[]> {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${me.id}/blocks`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error('Failed to fetch blocks');
    }
    let data = await response.json();
    console.log(`BLOCK data: ${JSON.stringify(data)}`);
    return await Promise.all(data.map(async (item) => {
      const userProfile = await getProfilePictureUrl(item.nickname, item.login);
      const userStatus = new RelationUser(item, RelationStatusEnum.BLOCKED);
      userStatus.userProfile = userProfile;
      return userStatus;
    }));
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return [];
  }
}

// Helper function to get profile picture URL
async function getProfilePictureUrl(username : string, login : string) {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/public/avatars/${username}.png`);
  if (response.ok) {
    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);
  } else {
    return `https://www.gravatar.com/avatar/${md5(login)}/?d=wavatar`;
  }
}

</script>

<style scoped>

.friends-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: center;
  color: white;
  background-color: #131313;
  box-sizing: border-box;
}

.content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.scrollable-content {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.section {
  display: flex;
  flex-direction: column;
  flex: none;
  overflow: hidden;
}

.section p {
  padding-left: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}

.list {
  flex-grow: 1;
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.list li:hover {
  background-color: #444;
}

.selected {
  background-color: #444;
}

.user {
  display: flex;
  align-items: center;
  padding: 0.5em;
  max-height: 10vh;
  overflow: hidden;
  border-bottom: 1px solid #444;
}
.user:hover {
  background-color: #444;
}

.user-picture img {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 30px;
}

.user-info {
  display: flex;
  flex-grow: 1;
  cursor: pointer;
  margin-left: 1em;
  margin-right: 1em;
}

.user-status {
  display: flex;
  flex-grow: 1;
  cursor: pointer;
  margin-left: 1em;
  margin-right: 1em;
}

.user-info a {
  color: white;
  text-decoration: none;
}

.user-info a:hover {
  text-decoration: underline;
}

.buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
.buttons button {
  background-color: #333;
  color: white;
  border: none;
  padding: 0.5em  1em;
  margin: 0.5em;
  cursor: pointer;
}
.buttons button:hover {
  background-color: #555;
}

.tabs {
  display: flex;
}

.tabs button {
  background-color: #333;
}
.tabs button.active {
  background-color: #555;
}

</style>
