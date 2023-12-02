<script setup lang="ts">
import router from "@/router";
import socket from "../services/ws";

(async (): Promise<void> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include'
    });
    if (response.ok) {
      router.replace('/');
    }
  } catch (error) {
    console.error(error);
  }
  socket.disconnect();
})();

</script>

<template>
    <p>Loggin you out...</p>
</template>

<style scoped>

</style>
