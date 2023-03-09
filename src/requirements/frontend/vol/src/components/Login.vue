<script setup lang="ts">
import Toast from "@/components/Toast.vue";

const intra_login = import.meta.env.VITE_URL_42;
const hasParam = (paramName: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has(paramName);
};

let error: string | undefined = undefined;

(async () => {
  try {
    if (hasParam("code")) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/intra/callback?code=${code}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw "Nope";
      window.location.href = "/";
    }
    if (hasParam("error")) {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error_description");
      if (error)
        throw error;
      throw "Error while logging in, please try again"
    }
  } catch (err) {
    console.error(err);
    error = err as string;
  }
})();
</script>

<template>
  <Toast v-if="error" :error-message="error">
    <i class="material-icons">error</i>
  </Toast>
  <fieldset v-if="!hasParam('code')">
    <legend>42 Login</legend>
    <a :href="intra_login">
      <button type="submit">Login with 42</button>
    </a>
  </fieldset>
  <p v-else>Login you in...</p>
</template>

<style scoped>
.toast .material-icons {
  color: #fff;
}
</style>
