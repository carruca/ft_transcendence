<script setup lang="ts">
import Splash from "../components/Splash.vue";
import { onMounted, ref } from "vue";
import HomeVue from "../components/Home.vue";
import { loggedInFn } from "@/components/AuthCheck";

const loggedIn = ref<boolean | undefined>(false);
const user = ref<Object | undefined>(undefined);

onMounted(async () => {
  user.value = await loggedInFn();
  loggedIn.value = user.value !== undefined;
});

</script>

<template>
  <main class="main_content">
    <Splash v-if="!loggedIn" />
    <HomeVue :user="user" v-else/>
  </main>
</template>

<style>
.main_content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
