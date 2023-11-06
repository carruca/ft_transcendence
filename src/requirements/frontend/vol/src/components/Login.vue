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
    if (document.cookie.includes('token')) {
      window.location.href = "/";
    }
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
  <section>
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
        Login
        {{
          mock_login === "true" && hasParam("mock", "true")
            ? "(Not mocked)"
            : ""
        }}
      </legend>
      <a :href="intra_login">
        <button type="submit">
          <svg>
            <image
              xlink:href="/42logo.svg"
            />
          </svg>
        </button>
      </a>
    </fieldset>
    <p v-else>Login you in...</p>
  </section>
</template>

<style scoped>
.toast .material-icons {
  color: #fff;
}

section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

fieldset {
  border: none;
}

fieldset button {
  background: none;
  border: none;
  cursor: pointer;
  width: 4em;
  height: 4em;
  padding: 0;
}

fieldset button svg {
  width: 4em;
  height: 4em;
  filter: invert(1);
  transition: filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

fieldset button:hover svg {
  filter: invert(0) drop-shadow(0 0 0.5rem #000000);
}

@media (prefers-color-scheme: dark) {
  fieldset button svg {
    filter: invert(0);
  }

  fieldset button:hover svg {
    filter: invert(1) drop-shadow(0 0 0.5rem #fff);
  }
}

fieldset button svg image {
  width: 4em;
  height: 4em;
}
</style>
