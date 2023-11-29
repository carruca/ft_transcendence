<script setup lang="ts">
import { ref, onMounted } from 'vue';
import md5 from 'md5';

interface rankingUser {
    nickname: string;
    rating: number;
};

const props = defineProps({
    rankingUsers: {
      type: Array as () => rankingUser[],
      required: true
    }
});

const rankingUsers = ref(props.rankingUsers);

const firstPlace  = ref();
const secondPlace = ref();
const thirdPlace  = ref();

const firstUser   = ref<string>('no_podium');
const secondUser  = ref<string>('no_podium');
const thirdUser   = ref<string>('no_podium');

const animateImage = (position : number) => {
  const image = document.querySelector(`.podium-item:nth-child(${position}) .podium-image`);
  image.classList.add('animate');
};

const resetImage = (position : number) => {
  const image = document.querySelector(`.podium-item:nth-child(${position}) .podium-image`);
  image.classList.remove('animate');
};

const redirectToProfile = (nickname : string) => {
  if (nickname === 'no_podium') return;
  window.location.href = `/${nickname}`;
};

const checkImage = async (username : string) => {
  if (username === 'no_podium') return `${import.meta.env.VITE_BACKEND_URL}/public/no_podium.png`;

  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/public/avatars/${username}.png`);
  if (response.ok) {
    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);
  } else {
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
      const intraLogin = await response.json().then((data) => data.login);
      return `https://www.gravatar.com/avatar/${md5(intraLogin)}/?d=wavatar`;
    } catch (error) {
      console.log(error);
    }
  }
}

onMounted(async () => {
  firstUser.value   = rankingUsers.value[0]?.nickname ?? 'no_podium';
  secondUser.value  = rankingUsers.value[1]?.nickname ?? 'no_podium';
  thirdUser.value   = rankingUsers.value[2]?.nickname ?? 'no_podium';

  firstPlace.value  = await checkImage(firstUser.value);
  secondPlace.value = await checkImage(secondUser.value);
  thirdPlace.value  = await checkImage(thirdUser.value);
});

</script>

<template>
  <div class="podium">
    <div class="podium-item" @click="redirectToProfile(secondUser)">
      <img
        class="podium-image second-place"
        :src="secondPlace"
        alt="2nd Place"
        @mouseover="animateImage(1)"
        @mouseleave="resetImage(1)"
      />
      <div class="label" style="color: rgb(226, 226, 226);">SECOND</div>
    </div>

    <div class="podium-item" @click="redirectToProfile(firstUser)">
      <img
      class="podium-image first-place"
      :src="firstPlace"
      alt="1st Place"
      @mouseover="animateImage(2)"
      @mouseleave="resetImage(2)"  
      />
      <div class="label" style="color: rgb(255, 255, 0);">FIRST</div>
    </div>
    
    <div class="podium-item" @click="redirectToProfile(thirdUser)">
      <img class="podium-image third-place"
        :src="thirdPlace"
        alt="3rd Place"
        @mouseover="animateImage(3)"
        @mouseleave="resetImage(3)"
      />
      <div class="label" style="color: rgb(179, 72, 72);">THIRD</div>
    </div>
    
  </div>
</template>

<style scoped>
.podium {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.podium-item {
  position: relative;
  text-align: center;
  flex: 1;
}

.podium-image {
  display: block;
  border-radius: 50%;
  width: 11em;
  height: 11em;
  transition: transform 0.2s;
}

.first-place {
  margin-top: -200px;
}

.second-place {
  margin-top: 75px;
}

.third-place {
  margin-top: 175px;
}

.animate {
  transform: scale(1.1);
}

.label {
  font-size: 24px;
  margin-top: 10px;
}
</style>
