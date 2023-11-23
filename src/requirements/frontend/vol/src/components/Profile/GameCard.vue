<script setup lang="ts">
import { ref, onMounted } from 'vue';

const matches = ref<Array <gameMatch>>();
const userID : Number = 3;
let currentPage : number = 0;
let totalHist : number;

interface APIResponseArrayHistory {
  id: string;
  type: string;
  start: string;
  end: string;
  users: {
    id: string;
    userId: number;
    score: number;
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
  who : String,
  myPoints : Number,
  hisPoints : Number,
  duration : String,
};

const weGotHist = ref(false);
const no_hist = `${import.meta.env.VITE_BACKEND_URL}/public/no_hist.png`;

function winStatus(points1 : Number, points2 : Number) {
  return points1 >= points2 ? '✅Victory✅' : '❌Defeated❌';
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
        return {
          id: match.id,
          type: match.type,
          date: new Date(match.start).toLocaleString(),
          win: match.users[0].score >= match.users[1].score ? true : false,
          who: 'Zacarías',//TODO: take user
          myPoints: match.users[0].score,
          hisPoints: match.users[1].score,
          duration: `${Math.floor((new Date(match.end).getTime() - new Date(match.start).getTime()) / 1000)}s`
        };
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
          <td>{{ winStatus(match.myPoints, match.hisPoints) }}</td>
          <td>{{ match.date }}</td>
          <td class="type-section">{{ match.type }}</td>
          <td v-if="match.type==='special'">
            <ul>
              <li>Hola</li>
              <li>cara</li>
              <li>cola</li>
            </ul>
          </td>
          <td v-else>{{ match.who }}</td>
          <td>{{ match.myPoints }}/{{ match.hisPoints }}</td>
          <td>{{ match.duration }}</td>
        </tr>
      </table>
      <button @click="prevHistorial" :disabled="currentPage === 0">&#8592;</button>
      <button @click="nextHistorial" :disabled="currentPage <= (totalHist - 1)">&#8594;</button> <!-- TODO: This do not get disabled when no history -->
    </div>
    <img v-else :src="no_hist" alt="empty historial"/>
  </div>
</template>

<style scoped>
/* TODO: deal with special games */
/* TODO: add lines between values */
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

.type-section {
	font-size: 1ch;
	font-family: 'Retro Stereo Wide';
}

</style>
