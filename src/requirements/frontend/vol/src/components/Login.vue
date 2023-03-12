<script setup lang="ts">
import Toast from "@/components/Toast.vue";

const intra_login = import.meta.env.VITE_URL_42;
const mock_login = import.meta.env.VITE_MOCK_LOGIN;
const hasParam = (paramName: string, value: string | undefined = undefined) => {
  const urlParams = new URLSearchParams(window.location.search);
  if (value) return urlParams.get(paramName) === value;
  return urlParams.has(paramName);
};

let error: string | undefined = undefined;

(async () => {
  try {
    if (hasParam("code")) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const mock = urlParams.get("mock");
      const params = {
        code: code as string,
        mock: mock_login ? (mock as string) : "false",
      };
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/intra/callback?` +
          new URLSearchParams(params),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw response.statusText;
      window.location.href = "/";
    }
    if (hasParam("error")) {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error_description");
      if (error) throw error;
      throw "Error while logging in, please try again";
    }
  } catch (err) {
    console.error(err);
    error = err as string;
  }
})();

const mockUsers = [
  {
    id: "91166",
    login: "dpoveda-",
  },
  {
    id: "70715",
    login: "madorna-",
  },
  {
    id: "69693",
    login: "pmira-pe",
  },
  {
    id: "69584",
    login: "rnavarre",
  },
  {
    id: "63923",
    login: "tsierra-",
  },
];
</script>

<template>
  <Toast v-if="error" :error-message="error">
    <i class="material-icons">error</i>
  </Toast>
  <ul v-if="mock_login === 'true' && hasParam('mock', 'true')">
    <li v-for="user in mockUsers" :key="user.id">
      <a :href="`?code=${user.id}&mock=true`">
        {{ user.login }}
      </a>
    </li>
  </ul>
  <fieldset v-if="!hasParam('code')">
    <legend>
      42 Login
      {{
        mock_login === "true" && hasParam("mock", "true") ? "(Not mocked)" : ""
      }}
    </legend>
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
