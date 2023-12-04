<script setup lang="ts">
import Splash from "../components/Splash.vue";
import { onMounted, ref } from "vue";
import HomeVue from "../components/Home.vue";
import { loggedInFn } from "@/components/AuthCheck";
import Toast from "../components/Toast.vue";

const loggedIn = ref<boolean | undefined>(false);
const user = ref<Object | undefined>(undefined);
const error = ref<string | undefined>(undefined);

onMounted(async () => {
  try {
    user.value = await loggedInFn();
    loggedIn.value = user.value !== undefined;
  } catch (_error) {
    error.value = _error;
    console.error(_error);
  }
});

const clearError = () => {
  error.value = undefined;
};

const onUserUpdated = async (c) => {
  try {
    user.value = undefined;
    loggedIn.value = user.value !== undefined;
    user.value = await loggedInFn();
    loggedIn.value = user.value !== undefined;
  } catch (_error) {
    error.value = _error;
    console.error(_error);
  }
}

</script>

<template>
  <main class="main_content">
    <Toast v-if="error" :error-message="error" :close-toast="clearError">
      <i class="material-icons">error</i>
    </Toast>
    <Splash v-if="!loggedIn" />
    <HomeVue :user="user" @userUpdated="onUserUpdated" @userBanned="onUserUpdated" v-else/>
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
