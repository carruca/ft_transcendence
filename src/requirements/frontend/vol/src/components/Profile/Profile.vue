<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import router from '@/router';
import GameCard from './GameCard.vue';
import AchivementsCard from './achivementsCard.vue';
import EditProfile from './EditProfile.vue';
import friendsBotton from './friendsBotton.vue';

type ConnectionStatus = {
  [key: number] : string;
};

const connectionStatus : ConnectionStatus = {
  0: 'Offline 🔴',
  1: 'Online 🟢',
  2: 'In game 🎮'
};//TODO: check connection status

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const ID = ref<[string, string]>(['none', 'none']);
const usernameRef = ref()
const profilePictureRef = ref();
const rating = ref();
const wins = ref<number>();
const losses = ref<number>();

const editPage = ref(false);
const state = ref(1);
const itsMe = ref(true);

const route = useRouter();
const unmounted = ref(false);

async function askUserinfo(username : string | string[]) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/${username}`,
      {
        method: "GET",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
      });
    if (response.ok)
    {
      const userInfo = await response.json();
      return userInfo;
    }
    else
    {
      router.push('/404');
    }
  } catch (error) {
    console.log(error);
  }
};

async function loadProfile() {
  // TODO: Add animation while loading profile info
  const { user } = props;
  // console.log({ user })

  let username : string | string[]; 
  username = route.currentRoute.value.params.username;
  // Check if the route is 'profile'
  if (route.currentRoute.value.params.username === 'profile') {
    username = user.nickname;
  }

  // Depending on if the user is himself or not, we will use
  // the user object or fetch the other user's info 
  itsMe.value = user.nickname === username;
  
  let userInfo : Record<string, any>;

  // If it's not the user, fetch the user info
  if (itsMe.value === false) {
    userInfo = await askUserinfo(username);
    console.log(userInfo);
  }
  else {
    userInfo = user;
  }
 
  // Assign the values to the refs
  usernameRef.value = username;
  profilePictureRef.value = `${import.meta.env.VITE_BACKEND_URL}/public/avatars/${username}.png`
  
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
  console.log('ACA TA EL INODOROQUE HABLA 1 ->' + ID.value[0]);
  console.log('ACA TA EL INODOROQUE HABLA 2 ->' + ID.value[1]);
};

const stopWatch = watch(
  () => router.currentRoute.value.params.username,
  (username) => {
    setTimeout(() => {
      if (unmounted.value) return;
      loadProfile();
    }, 10);
  }
);

onMounted(async () => {
  await route.isReady();
  loadProfile();
});

onBeforeUnmount(() => {
  unmounted.value = true;
  console.log(unmounted.value);
  console.log('unmounted');
  stopWatch();
});

const launchEditPage = () => {
  editPage.value = true;
};

const closeEditPage = async () => {
  editPage.value = false;
};

</script>

<template>

<div class="profile">
  <div class="profile-container">
    <div>
      <img class="profile-picture" :src="profilePictureRef" alt="Profile Picture">
      <div>
        <div class="state">{{ connectionStatus[state] }}</div>
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
        <EditProfile v-if="editPage" @close="closeEditPage" :user="user.nickname"></EditProfile>
      </div>
      <div v-else>
        <friendsBotton :users="ID"></friendsBotton>
      </div>
    </div>
  </div>

  <div class="profile-cards" v-if="ID[0] !== 'none'">
    <GameCard/>
    <AchivementsCard :user="ID[0]"/>
  </div>
</div>


</template>

<style scoped>
/* TODO: Profile photo on the left and the rest on the right */
/* TODO: improve css */
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
  font-family: 'Retro Stereo Wide', sans-serif;
}

.stat {
  display: flex;
  flex-direction: column;
  padding-left: 10px;
}

.stat-label {
  font-size: 14px;
}
/* 
.stat-value {
  font-size: 20px;
}

.events {
  list-style: none;
  padding: 0;
  margin: 0;
} */

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
