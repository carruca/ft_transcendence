<script setup lang="ts">
import { onMounted, ref, defineProps } from 'vue';

interface ResponseAchivements {
  id: string;
  createDate: string;
  achievement: {
    description: string;
    id: string;
    image: string;
    name: string;
  }
};

interface justAchivements {
  name: string;
  description: string;
  image: string;
  createDate: string;
};

const props = defineProps({
  user: {
    type: String,
    required: true
  }
});

const achievements = ref<justAchivements[]>();
const userID = ref<string>(props.user);

const weGotAchivs = ref(false);
const no_achiv = `${import.meta.env.VITE_BACKEND_URL}/public/no_achiv.png`;

// Function to calculate the time difference
function getTimeDifference(createDate) {
  const currentDate : Date = new Date();
  const creationDate : Date = new Date(createDate);
  const timeDifference : number = currentDate - creationDate;
  return timeDifference;
}

// Function to format milliseconds into a readable format
function formatMilliseconds(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

async function loadAchievements() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/${userID.value}/achievements`, //TODO: ONLY TAKES LOGGED USER ACHIEVEMENTS 
      {
        method: "GET",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      });
    if (response.ok) {
      const responseData : ResponseAchivements[] = await response.json();
      achievements.value = responseData.map((achiv : ResponseAchivements) => ({
        name: achiv.achievement.name,
        description: achiv.achievement.description,
        image: `${import.meta.env.VITE_BACKEND_URL}/public/achievements/${achiv.achievement.image}.svg`,
        createDate: formatMilliseconds(getTimeDifference(achiv.createDate))
      }));
      if (achievements.value.length > 0) {
        weGotAchivs.value = true;
      }
    }
    else
    {
      console.log('Error: could not recieve achievements data');
    }
  } catch (err) {
    console.log(err);
  }
}

onMounted(async () => {
  console.log('mounted')
  loadAchievements();
});

</script>

<template>
  <div class="container-card">
    <h2>Achivements</h2>
    <table class="table-card" v-if="weGotAchivs">
      <tr>
        <th></th>
        <th>Name</th>
        <th>Description</th>
        <th>Time</th>
      </tr>
      <tr v-for="achiv in achievements">
        <td><img :src="achiv.image" alt="achivement image" style="height: 40px;"></td>
        <td>{{ achiv.name }}</td>
        <td style="font-size: 12px;">{{ achiv.description }}</td>
        <td>{{ achiv.createDate }}</td>
      </tr>
    </table>
    <img v-else :src="no_achiv" alt="empty achivements"/>
  </div>
</template>

<style scoped>
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
  overflow: auto;
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

/* Hide the default scroll bar */
.container-card::-webkit-scrollbar {
  display: none;
}

</style>
