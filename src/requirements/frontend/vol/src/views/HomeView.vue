<script lang="ts">
import router from "@/router";
import { defineComponent } from "vue";
import Login from "../components/Login.vue";
import Splash from "../components/Splash.vue";

const loggedIn = async (): Promise<boolean | undefined> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include'
    });
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error(error);
  }
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  router.push("/login");
}

export default defineComponent({
  props: {
    loggedIn: {
      type: Boolean as () => boolean,
      required: false,
    },
  },
  data() {
    return {
      loggedIn: false,
    };
  },
  mounted: async function () {
    this.loggedIn = await loggedIn() as any;
  },
  components: {
    Login,
    Splash,
  },
})

</script>

<template>
  <main class="main_content">
    <Splash v-if="!loggedIn" />
    <p v-else>Estás dentro</p>
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
