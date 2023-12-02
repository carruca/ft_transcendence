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
                  :key="user.user[0].id"
                  class="user"
              >
                <div class="user-picture">
                  <img :src="user.userProfile" alt="Profile picture" class="friend-image">
                </div>
                <div
                    class="user-info"
                    @click="handleUserClick(user.user[0].nickname)">
                  <h3>{{ user.user[0].nickname }}</h3>
                </div>
                <div class="user-actions">
                  <friendsBotton :users="[me.id, user.user[0].id]"></friendsBotton>
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

import { ref, onMounted, computed } from 'vue';
import router from '@/router';
import md5 from 'md5';
import friendsBotton from '@/components/Profile/friendsBotton.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});
const me = props.user;

const isLoading = ref(true);

// TODO change to 'Online' when possible
const selectedTab = ref('All');
const tabs = ['Online', 'All', 'Pending', 'Blocked'];

// TODO onlineUsers and blockedUsers
const friendsList = ref([]);
const blocksList = ref([]);

const allUsers = computed(() => friendsList.value.filter(friend => friend.status === 1));
const onlineUsers = [];
const pendingUsers = computed(() => friendsList.value.filter(friend => friend.status === 0));
const blockedUsers = computed(() => blocksList.value);

onMounted(async () => {
  isLoading.value = true;
  friendsList.value = await fetchFriends();
  blocksList.value = await fetchBlocks();
  isLoading.value = false;
});

function getSelectedTabList() {
  switch (selectedTab.value) {
    case 'All':
      return allUsers.value;
    case 'Online':
      return [];
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
async function fetchFriends() {
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
    data = await Promise.all(data.map(async (item) => {
      const userProfile = await getProfilePictureUrl(item.user[0].nickname, item.user[0].login);
      item.userProfile = userProfile;
      return item;
    }));
    return data;
  } catch (error) {
    console.error('Error fetching friends:', error);
  }
}
async function fetchBlocks() {
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
    data = await Promise.all(data.map(async (item) => {
      const userProfile = await getProfilePictureUrl(item.user[0].nickname, item.user[0].login);
      item.userProfile = userProfile;
      return item;
    }));
    return data;
  } catch (error) {
    console.error('Error fetching blocks:', error);
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
  max-height: 9vh;
  width: auto;
  display: block;
  margin-left: 1em;
  margin-right: 1em;
  border-radius: 50%; /* Make the image rounded */
}

.user-info {
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
