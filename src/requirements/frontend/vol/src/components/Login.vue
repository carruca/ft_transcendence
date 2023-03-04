<script setup lang="ts">
const intra_login = import.meta.env.VITE_URL_42;
const has_code = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has("code");
}
(async () => {
    if (has_code()) {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/intra/callback?code=${code}`, {
            method: "GET",
            headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            },
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Nope')
        window.location.href = '/'
    }
})()
</script>

<template>
  <fieldset v-if="!has_code()">
    <legend>42 Login</legend>
    <a :href="intra_login">
      <button type="submit">Login with 42</button>
    </a>
  </fieldset>
  <p v-else>Login you in...</p>
</template>
