<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps({
  user: {
    type: String,
    required: true
  }
});

const matches = ref<Array <gameMatch>>();
const userID : string = props.user;
let currentPage : number = 0;
let totalHist : number;

interface APIResponseArrayHistory {
  id: string;
  type: string;
  start: string;
  end: string;
  users: {
    id: string;
    score: number;
    user: {
      id: string;
      nickname: string;
    }
  } [];
}

interface APIResponseHistorial {
  results: APIResponseArrayHistory[];
  currentPage: number;
  total: number;
}

interface gameMatch {
  id : String,
  type : String,
  date : String,
  win : Boolean,
  who : String | String[],
  myPoints : Number,
  hisPoints : Number,
  duration : String,
};

const weGotHist = ref(false);
const no_hist = `${import.meta.env.VITE_BACKEND_URL}/public/no_hist.png`;

function winStatus(didWon : Boolean) {
  return didWon ? '✅Victory✅' : '❌Defeated❌';
}

async function askHistorial() {
  try{
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}` + `/matches/history/` + userID + `?page=` + currentPage,
      {
        method: "GET",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
      });
  
    if (response.ok) {
      const responseData : APIResponseHistorial = await response.json();
      matches.value = responseData.results.map(match => {
        if (match.type === `normal`) {
          const me = match.users.find(user => user.user.id === userID);
          const opponent = match.users.find(user => user.user.id !== userID);
          return {
            id: match.id,
            type: match.type,
            date: new Date(match.start).toLocaleString(),
            win: me.score >= opponent.score ? true : false,
            who: opponent.user.nickname,
            myPoints: match.users[0].score,
            hisPoints: match.users[1].score,
            duration: `${Math.floor((new Date(match.end).getTime() - new Date(match.start).getTime()) / 1000)}s`
          };
        }
        else {
          const me = match.users.find(user => user.user.id === userID);
          const ally = match.users.find(user => user.score === me?.score);
          const opponent1 = match.users.find(user => user.score !== me?.score);
          const opponent2 = match.users.find(user => user.score !== me?.score && user.user !== opponent1?.user);
          return {
            id: match.id,
            type: match.type,
            date: new Date(match.start).toLocaleString(),
            win: me?.score !== undefined && opponent1?.score !== undefined ? me.score >= opponent1.score : false,
            who: [ ally?.user.nickname, opponent1?.user.nickname, opponent2?.user.nickname ],
            myPoints: match.users[0].score,
            hisPoints: match.users[1].score,
            duration: `${Math.floor((new Date(match.end).getTime() - new Date(match.start).getTime()) / 1000)}s`
          };

        }
      });
      totalHist = Math.ceil(responseData.total / 10);//Total number of historial pages
      if (matches.value.length > 0) {
        weGotHist.value = true;
      }
    } else {
      console.log('Error: could not recieve historial data');
    }
  } catch (err) {
    console.log(err);
  }
};

async function prevHistorial()
{
  if (currentPage != 0)
    currentPage--;
  askHistorial();
};

async function nextHistorial()
{
  if (currentPage < (totalHist - 1))
    currentPage++;
  askHistorial();
};

onMounted(async () => {
  askHistorial();
});

</script>

<template>
  <div class="container-card">
    <h2>Historial</h2>
    <div v-if="weGotHist">
      <table class="table-card">
        <tr>
          <th>Result</th>
          <th>Date</th>
          <th>Type</th>
          <th>Opponent</th>
          <th>Points</th>
          <th>Duration</th>
        </tr>
        <tr v-for="match in matches">
          <td>{{ winStatus(match.win) }}</td>
          <td>{{ match.date }}</td>
          <td class="type-section">{{ match.type }}</td>
          <td v-if="match.type==='special'">
            <ul>
              <li><router-link :to="`/profile/${match.who[0]}`" style="color:rgb(101, 203, 114)">{{ match.who[0] }}</router-link></li>
              <li><router-link :to="`/profile/${match.who[1]}`" style="color:rgb(251, 99, 99)">{{ match.who[1] }}</router-link></li>
              <li><router-link :to="`/profile/${match.who[2]}`" style="color:rgb(251, 99, 99)">{{ match.who[2] }}</router-link></li>
            </ul>
          </td>
          <td v-else><router-link :to="`/profile/${match.who}`" style="color:aliceblue">{{ match.who }}</router-link></td>
          <td>{{ match.myPoints }}/{{ match.hisPoints }}</td>
          <td>{{ match.duration }}</td>
        </tr>
      </table>
      <button @click="prevHistorial" :disabled="currentPage === 0">&#8592;</button>
      <button @click="nextHistorial" :disabled="currentPage <= (totalHist - 1)">&#8594;</button>
    </div>
    <img v-else :src="no_hist" alt="empty historial"/>
  </div>
</template>

<style scoped>
/* TODO: deal with special games */
img {
  width: 90%;
  height: 80%;
  object-fit: contain;
  margin-top: 10px;
  margin-bottom: 10px;
}

.container-card {
  border: 1px solid rgb(48, 48, 48);
  background-color: rgb(65, 65, 65);
  width: 46em;
  height: 34em;
}

.container-card h2 {
  top: 10px;
}

.table-card {
  margin: 0 auto;
  border-collapse: collapse;
  background-color: #272727;
  padding: 10px;
  width: 95%;
}

.table-card th,
.table-card td {
  border: none;
  padding: 8px;
}

ul {
padding: 0;
}

li {
  list-style-type: none;
}

.type-section {
	font-size: 1ch;
	font-family: 'Retro Stereo Wide';
}

</style>
