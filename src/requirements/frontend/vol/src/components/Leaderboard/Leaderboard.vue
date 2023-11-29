<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import Podium from './Podium.vue';
  import LeadertableVue from './Leadertable.vue';

  interface rankingUser {
    nickname: string;
    rating: number;
    wins: number;
    losses: number;
  };

  const rankingUsers = ref<rankingUser[]>();

  const loading = ref(`${import.meta.env.VITE_BACKEND_URL}/public/loading.png`);

  async function askRanking() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/users/leaderboard`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          credentials: "include",
        });
      if (!response.ok)
      {
        throw new Error('Could not recieve ranking data');
      }
      const responseData : rankingUser[] = await response.json();
      rankingUsers.value = responseData.sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.log(error);
    }
  };

  onMounted(() => {
    askRanking();
  });

</script>

<template>
  <div class="leaderboard-container">
    <h1 style="font-family: 'Retro Stereo Wide';">Leaderboard</h1>

    <div v-if="rankingUsers" class="leaderboard-cardscont">
      <div class="leaderboard-card-table">
        <h3>Top 3</h3>
        <Podium :rankingUsers="rankingUsers"/>
      </div>
      
      <div class="leaderboard-card-table">
        <h3>Full Leaderboard</h3>
        <LeadertableVue :rankingUsers="rankingUsers"/>
      </div>
    </div>
    <img v-else :src="loading" alt="loading">
  
  </div>
</template>

<style scoped>
.leaderboard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #f0f0f0;
  width: 95%;
  height: 95%;
  overflow: auto;
}

.leaderboard-cardscont {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  gap: 2px;
  overflow: auto;
}

.leaderboard-card-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgb(65, 65, 65);
  padding: 20px;
  width: 37em;
  height: 34em;
}

</style>
