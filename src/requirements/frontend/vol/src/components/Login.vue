<script setup lang="ts">
const intra_login = import.meta.env.VITE_URL_42;
const has_code = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has("code");
}
if (has_code()) {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/42`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: code,
    }),
  }).then((response) => {
    if (response.status === 200) {
      window.location.href = "/";
    }
  });
}
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
