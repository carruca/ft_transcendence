<script setup lang="ts">
import { defineProps, ref, onMounted } from 'vue';

interface gameMatch {
  id : Number,
  date : String,
  win : Boolean,
  who : String,
  myPoints : Number,
  hisPoints : Number,
  duration : String,
}


const matches : gameMatch [] = ref([{
    date: '11-11-1111',
    win: true,
    who: 'rnavarre',
    myPoints: 5,
    hisPoints: 4,
    duration: '2:30',
  },{
    date: '22-22-2222',
    win: false,
    who: 'dpoveda',
    myPoints: 2,
    hisPoints: 5,
    duration: '1:07',
  },{
    date: '33-33-3333',
    win: false,
    who: 'Castela😈',
    myPoints: 0,
    hisPoints: 5,
    duration: '6:66',
  }]);

function winStatus(status : Boolean) {
  return status ? '✅Victory✅' : '❌Defeated❌';
}

</script>

<template>
  <div>
    <h2>Historial</h2>
    <div>
      <table class="table-card">
        <tr >
          <th>Result</th>
          <th>Date</th>
          <th>Opponent</th>
          <th>Points</th>
          <th>Duration</th>
        </tr>
        <tr v-for="match in matches">
          <td>{{ winStatus(match.win) }}</td>
          <td>{{ match.date }}</td>
          <td>{{ match.who }}</td>
          <td>{{ match.myPoints }}/{{ match.hisPoints }}</td>
          <td>{{ match.duration }}</td>
        </tr>
	    </table>
    </div>
  </div>
</template>

<style>

.table-card {
  border-collapse: collapse;
  background-color: #272727;
  padding: 10px;
}

.table-card th,
.table-card td {
  border: none;
  padding: 8px;
}

</style>
