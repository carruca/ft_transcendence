<script setup lang="ts">
import router from "@/router";
import Splash from "../components/Splash.vue";
import { onMounted, ref } from "vue";
import HomeVue from "../components/Home.vue";

const loggedIn = ref<boolean | undefined>(false);
const user = ref<Object | undefined>(undefined);

const loggedInFn = async (): Promise<boolean | undefined> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include'
    });
    if (response.status === 401) {
      const data = await response.json();
      if ('message' in data) {
        switch (data.message) {
          case 'No nickname':
            router.replace("/setup");
            break;
          case 'No 2FA token passed':
            router.replace("/2fa");
            break;
          default:
            router.replace("/login");
            break;
        }
        return true;
      }
    }
    if (response.ok) {
      user.value = await response.json();
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
