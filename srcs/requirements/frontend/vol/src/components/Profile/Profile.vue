<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import md5 from 'md5';
import router from '@/router';
import GameCard from './GameCard.vue';
import AchivementsCard from './achivementsCard.vue';
import EditProfile from './EditProfile.vue';
import friendsBotton from './friendsBotton.vue';
import { connectionStatus } from './ConnectionStatus'
import { socket } from '@/services/ws';

import { ChatClient } from '@/services/chat-client';


const client = ChatClient.getInstance();

const props = defineProps({
	user: {
		type: Object,
		required: true
	}
});

const emit = defineEmits(['userUpdated']);

const onUserUpdated = () => {
  emit('userUpdated');
};

const ID = ref<[string, string]>(['none', 'none']);
const usernameRef = ref()
const profilePictureRef = ref();
const rating = ref();
const wins = ref<number>();
const losses = ref<number>();

const userStatus = ref<number>(3);

const editPage = ref(false);
const itsMe = ref(true);

const route = useRouter();
const loadedProfile = ref(false);
const unmounted = ref(false);

async function askUserinfo(username : string | string[]) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/${username}`,
      {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        },
        credentials: "include",
      });
    if (!response.ok)
    {
      router.push('/404');
    }
    return await response.json();
  } catch (error) {
    console.log(error);
  }
};

const checkImage = async (username : string, login : string) => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/public/avatars/${username}.png`);
  if (response.ok) {
    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);
  } else {
    return `https://www.gravatar.com/avatar/${md5(login)}/?d=wavatar`;
  }
};

async function loadProfile() {
  const { user } = props;

  let username : string | string[] = route.currentRoute.value.params.username;
  // Check if the route is 'profile'
  if (username === undefined) {
    username = user.nickname;
  }

  // Depending on if the user is himself or not, we will use
  // the user object or fetch the other user's info 
  itsMe.value = user.nickname === username;
  
  let userInfo : Record<string, any>;

  // If it's not the user, fetch the user info
  if (itsMe.value === false) {
    userInfo = await askUserinfo(username);
  }
  else {
    userInfo = user;
  }
 
  // Assign the values to the refs
  usernameRef.value = username;
  profilePictureRef.value = await checkImage(username, userInfo.login);

  rating.value = userInfo.rating;
  wins.value = userInfo.wins;
  losses.value = userInfo.losses;

  
  if (itsMe.value)
  {
    ID.value = [userInfo.id, 'none'];
	}
	else {
    ID.value = [user.id, userInfo.id];
	}

  // Watch user status
  userStatus.value = userInfo.status;
  //TODO hacer que esto se actualice con client
  if (!itsMe.value)
  client.userWatch([ ID.value[1] ]);

  loadedProfile.value = true;
};

const stopWatch = watch(
  () => router.currentRoute.value.params.username,
  () => {
    if (unmounted.value) return;
    loadedProfile.value = false;
    if (!itsMe.value)
      client.userUnwatch([ ID.value[1] ]);
    loadProfile();
});

const handleStatus = (responseJSON) => {
  const userDTO = JSON.parse(responseJSON);

  if (userDTO.sourceUserId === ID.value[1]) {
    if (userDTO.changes.status != undefined)
      userStatus.value = userDTO.changes.status;
  }
};

onMounted(async () => {
  await route.isReady();
  socket.on('userUpdated', handleStatus);
  loadProfile();
});

onBeforeUnmount(() => {
  unmounted.value = true;
  if (!itsMe) client.userUnwatch([ ID.value[1] ]);
  stopWatch();
  socket.off('userUpdated', handleStatus);
});

const launchEditPage = () => {
  editPage.value = true;
};

const closeEditPage = async () => {
  editPage.value = false;
};

</script>

<template>
<div v-if="loadedProfile" class="profile">
  <div class="profile-container">
    <div>
      <img class="profile-picture" :src="profilePictureRef" alt="Profile picture">
      <div v-if="!itsMe">
        <div class="state">{{ connectionStatus[userStatus] }}</div>
      </div>
    </div>
    <div class="profile-info">
      <h2 class="nickname">{{ usernameRef }}</h2>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Rating</span>
          <span ref="stat-value">{{ rating }}</span>
        </div>
        <div class="stat" style="color: rgb(0, 219, 0);">
          <span class="stat-label">Wins</span>
          <span ref="stat-value">{{ wins }}</span>
        </div>
        <div class="stat" style="color:rgb(203, 18, 18)">
          <span class="stat-label">Losses</span>
          <span ref="stat-value">{{ losses }}</span>
        </div>
      </div>
      <div v-if="itsMe">
        <button class="fancy-button-green" @click="launchEditPage">Edit profile</button>
        <EditProfile v-if="editPage && profilePictureRef" @close="closeEditPage" :nickname="usernameRef" :profilePicture="profilePictureRef" @userUpdated="onUserUpdated"/>
      </div>
      <div v-if="!itsMe">
        <friendsBotton :users="ID"></friendsBotton>
      </div>
    </div>
  </div>

  <div class="profile-cards">
    <GameCard :user="ID[itsMe ? 0 : 1]"/>
    <AchivementsCard :user="ID[itsMe ? 0 : 1]"/>
  </div>
</div>
<div v-else>
  <h1>Loading...</h1>
</div>
</template>

<style scoped>
.profile {
  text-align: center;
  background-color: rgb(34, 31, 31);
  color: rgb(200, 200, 200);
  font-family: 'Oswald';
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
}

.profile-cards {
  display: flex;
  flex-wrap: wrap;
  padding: 25px;
  justify-content: space-evenly;
}

.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin: 0;
}

.profile-picture {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 30px;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 24px;
  margin: 10px 0;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
  max-width: 200px;
  margin-left: auto;
  margin-right: auto;
  font-family: 'Audiowide', sans-serif;
}

.stat {
  display: flex;
  flex-direction: column;
  padding-left: 10px;
}

.stat-label {
  font-size: 14px;
}

.fancy-button-green {
  padding: 10px 20px;
  font-family: 'Bebas Neue';
  border: none;
  background-color: #4e4e4e;
  color: #fff;
  font-size: 18px;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.7);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.fancy-button-green:hover {
  transform: translateY(-2px);
  background-color: #40be46;
}

.fancy-button-green:active {
  transform: translateY(1px);
  background-color: #3E8948;
}

/* Hide the default scroll bar */
.profile::-webkit-scrollbar {
  display: none;
}

</style>
