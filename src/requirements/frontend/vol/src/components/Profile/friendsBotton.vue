<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';

const props = defineProps({
  users: {
    type: [String, String],
    required: true
  }
})

const users = ref();

// async function checkFriend() {
//   try {

//   }
// }

onMounted(() => {
  users.value = props.users;
  console.log(users.value[0]);
  console.log(users.value[1]);
  // checkFriend();
});

</script>

<template>
  <button class="fancy-button-green">Add to friends</button>
  <button class="fancy-button-red">Block</button>
</template>

<style scoped>
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
