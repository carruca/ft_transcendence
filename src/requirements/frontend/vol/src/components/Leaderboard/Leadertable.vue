<script setup lang="ts">
  import { ref, onMounted, defineProps } from 'vue';

  interface rankingUser {
    nickname: string;
    rating: number;
    wins: number;
    losses: number;
  };

  const props = defineProps({
    rankingUsers: {
      type: Array as () => rankingUser[],
      required: true
    }
  });

  const rankingUsers = ref(props.rankingUsers);
  
  let currentPage : number = 0;
  let totalRank : number = 1;
  
  function slideRank() {
    rankingUsers.value = props.rankingUsers.slice(currentPage * 12, (currentPage + 1) * 12);
  };

  async function prevRank() {
    if (currentPage != 0)
    {
      currentPage--;
      slideRank();
    }
  };

  async function nextRank() {
    if (currentPage < (totalRank - 1))
    {
      currentPage++;
      slideRank();
    }
  };

  onMounted(() => {
    totalRank = Math.ceil(props.rankingUsers.length / 12);
    slideRank();
  });

</script>

<template>
  <table class="table-card">
    <tr>
      <th>Player</th>
      <th>Rating</th>
      <th>Wins</th>
      <th>Losses</th>
    </tr>
    <tr v-for="ranking in rankingUsers">
      <td><router-link :to="`${ranking.nickname}`" style="color:aliceblue">{{ ranking.nickname }}</router-link></td>
      <td>{{ ranking.rating }}</td>
      <td>{{ ranking.wins }}</td>
      <td>{{ ranking.losses }}</td>
    </tr>
  </table>
  <div style="display: flex; flex-direction: row;">
    <button @click="prevRank" :disabled="currentPage === 0">&#8592;</button>
    <button @click="nextRank" :disabled="currentPage === (totalRank - 1)">&#8594;</button>
  </div>
</template>

<style scoped>
.table-card {
  margin: 0 auto;
  border-collapse: collapse;
  background-color: #272727;
  padding: 10px;
  width: 90%;
}

.table-card th,
.table-card td {
  border: none;
  padding: 8px;
  text-align: center;
}
</style>
