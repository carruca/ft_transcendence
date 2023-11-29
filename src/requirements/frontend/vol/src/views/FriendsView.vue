<template>
  <div v-if="isLoading">
    <p>Loading friends...</p>
  </div>
  <div v-else>
    <h2>Friends</h2>
    <ul class="friends-list">
      <li v-for="friend in friendsList" :key="friend.id" class="friend-item">
        <img :src="getProfilePictureUrl(friend.nickname)" alt="Friend's profile" class="friend-image">
        <h3>{{ friend.nickname }}</h3>
        <!-- Include the friendsButton component for each friend -->
        <!-- TODO add view profile button -->
        <friendsButton :users="[userId, friend.id]"></friendsButton>
      </li>
    </ul>
    <h2>Pending</h2>
    <ul class="friends-list">
      <li v-for="friend in friendsList" :key="friend.id" class="friend-item">
        <img :src="getProfilePictureUrl(friend.nickname)" alt="Friend's profile" class="friend-image">
        <h3>{{ friend.nickname }}</h3>
        <!-- Include the friendsButton component for each friend -->
        <!-- TODO add view profile button -->
        <friendsButton :users="[userId, friend.id]"></friendsButton>
      </li>
    </ul>
    <!-- TODO if we have time show a blocked users list with unblock option -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Replace with your actual user ID
// TODO get my user id, somehow (?

const props = defineProps({
	user: {
		type: Object,
		required: true
	}
});

const userId = 'your_user_id_here';

const friendsList = ref([]);
const isLoading = ref(true);

// Function to fetch friends data
async function fetchFriends() {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/friends`, {
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
    return data;
  } catch (error) {
    console.error('Error fetching friends:', error);
  }
}

// Helper function to get profile picture URL
function getProfilePictureUrl(username) {
  return `${import.meta.env.VITE_BACKEND_URL}/public/avatars/${username}.png`;
}

onMounted(async () => {
  isLoading.value = true;
  friendsList.value = await fetchFriends();
  console.log("AAAAA" + JSON.stringify(friendsList.value));
  isLoading.value = false;
  console.log()
});
</script>

<style scoped>
.friends-list {
  /* Add your styles here */
}

.friend-item {
  /* Style for each friend item */
}

.friend-image {
  /* Style for friend's profile image */
}
</style>
