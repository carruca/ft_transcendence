<script setup lang="ts">
import { onMounted, ref } from 'vue';
import GameCard from './GameCard.vue';
import AchivementsCard from './achivementsCard.vue';
import EditProfile from './EditProfile.vue';

const username : string = 'El sierras';
const profilePicture : string = 'https://cdn.intra.42.fr/users/948cb22973cf3c85d827011190ca2aaa/tsierra-.jpg';
const level : number = 69;
const wins : number = -1;

const editPage = ref(false);
const state = ref(1);
const itsMe = ref(true);

type ConnectionStatus = {
  [key: number] : string;
};

const connectionStatus : ConnectionStatus = {
  0: 'Offline 🔴',
  1: 'Online 🟢',
  2: 'In game 🎮'
};

// onMounted(async () => {
	// try {
	//   const userInfo = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth`, {
	//     method: "GET",
	//     headers: {
		
		//     },
	//   });
	// } catch (error) {
		//   console.error(error);
		// }
		// TODO: ask for user info
		// });

const toggleEditPage = () => {
	editPage.value = !editPage.value;
};

</script>

<template>

<div class="profile">
	<div>
		<div>
			<img class="profile-picture" :src="profilePicture" alt="Profile Picture">
			<h2 class="nickname">{{ username }}</h2>
			<div class="state">{{ connectionStatus[state] }}</div>
		</div>
		
		<div class="stats">
			<div class="stat">
        		<span class="stat-label">Level</span>
        		<span class="stat-value">{{ level }}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Wins</span>
				<span class="stat-value">{{ wins }}</span>
			</div>
		</div>
		
		<div>
			<div v-if="itsMe">
				<button class="fancy-button-green" @click="toggleEditPage">Edit profile</button>
				<EditProfile v-if="editPage" @close="toggleEditPage"></EditProfile>
			</div>
			<div v-else>
				<button class="fancy-button-green">Add to friends</button>
				<button class="fancy-button-red">Block</button>
			</div>
		</div>
	</div>

	<GameCard/>
  <AchivementsCard/>

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

.profile-picture {
	width: 150px;
	height: 150px;
	border-radius: 50%;
	object-fit: cover;
}

.nickname {
	font-size: 24px;
	margin: 10px 0;
}

.stats {
	display: flex;
	justify-content: space-around;
	margin: 20px 0;
	max-width: 200px;
	margin-left: auto;
	margin-right: auto;
	font-family: 'Retro Stereo Wide', sans-serif;
}

.stat {
	display: flex;
	flex-direction: column;
}

.stat-label {
	font-size: 14px;
}

.stat-value {
	font-size: 20px;
}

.events {
	list-style: none;
	padding: 0;
	margin: 0;
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

.fancy-button-red {
	padding: 10px 20px;
	font-family: 'Bebas Neue';
	border: none;
	background-color: #4e4e4e;
	color: #fff;
	font-size: 18px;
	box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.7);
	transition: transform 0.2s ease, background-color 0.2s ease;
}

.fancy-button-red:hover {
	transform: translateY(-2px);
	background-color: #cc4242;
}

.fancy-button-red:active {
	transform: translateY(1px);
	background-color: #893e3e;
}

</style>
