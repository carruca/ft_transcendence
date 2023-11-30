<template>
  <div v-if="isLoading">
    <p>Loading friends...</p>
  </div>
  <div v-else class="friends-view">
    <div class="content">
      <div class="section friends-section">
        <div class="section-header">
          <h2>Friends</h2>
        </div>
        <div class="scrollable-content">
          <div class="friends-list">
            <div v-if="friendsUsers.length === 0">
              <p>You have no friends yet.</p>
            </div>
            <div v-else class="list">
              <div
                  v-for="user in friendsUsers"
                  :key="user.user[0].id"
                  class="user">
                <div class="user-picture">
                  <img :src="getProfilePictureUrl(user.user[0].nickname)" alt="Profile picture" class="friend-image">
                </div>
                <div class="user-info">
                  <h3>{{ user.user[0].nickname }}</h3>
                </div>
                <div class="user-actions">
                  <!-- Include the friendsButton component for each friend -->
                  <!-- TODO add view profile button -->
                  <friendsBotton :users="[me.id, user.user[0].id]"></friendsBotton>
                </div>
              </div>
            </div>
          </div>
          <!-- TODO if we have time show a blocked users list with unblock option -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// Replace with your actual user ID
// TODO get my user id, somehow (?

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});
const me = props.user;

const friendsList = ref([]);
const isLoading = ref(true);

const friendsUsers = computed(() => friendsList.value.filter(friend => friend.status === 1));
const pendingUsers = computed(() => friendsList.value.filter(friend => friend.status === 0));
//const blockedUsers = computed(() => friendsList.value.map(friend => friend.status === 2));

onMounted(async () => {
  isLoading.value = true;
  friendsList.value = await fetchFriends();
  isLoading.value = false;
});

// Function to fetch friends data
async function fetchFriends() {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${me.id}/friends?status=0`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error('Failed to fetch friends');
    }

    const data = await response.json();
    console.log("AAAAA" + JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error fetching friends:', error);
  }
}

// Helper function to get profile picture URL
function getProfilePictureUrl(username) {
  return `${import.meta.env.VITE_BACKEND_URL}/public/avatars/${username}.png`;
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
}
.user-info:hover {
  text-decoration: underline;
}

.buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
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
