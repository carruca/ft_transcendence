<script setup lang="ts">
import router from "@/router";
import Splash from "../components/Splash.vue";
import { onMounted, ref } from "vue";
import HomeVue from "../components/Home.vue";

const loggedIn = ref<boolean | undefined>(false);

const loggedInFn = async (): Promise<boolean | undefined> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include'
    });
    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.error(error);
  }
  router.push("/login");
  return undefined;
};

onMounted(async () => {
  loggedIn.value = await loggedInFn();
});

</script>

<template>
  <main class="main_content">
    <Splash v-if="!loggedIn" />
    <HomeVue v-else/>
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
