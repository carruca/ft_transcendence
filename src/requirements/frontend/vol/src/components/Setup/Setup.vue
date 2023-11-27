<script setup lang="ts">
import router from '@/router';
import { onMounted } from 'vue';
import { loggedInFn } from '../AuthCheck';


onMounted(async () => {
  await loggedInFn();
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
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

  const form = document.querySelector('form') as HTMLFormElement;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
        method: "PUT",
        credentials: 'include',
        body: formData
      });
      if (response.ok) {
        router.replace('/');
      }
    } catch (error) {
      console.error(error);
    }
  });

  const nicknameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
  nicknameInput.addEventListener('input', async (event) => {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const submitButton = document.querySelector('input[type="submit"]') as HTMLInputElement;
    if (value.length >= 3 && value.length <= 20) {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/nickname/${value}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include'
      });
      submitButton.disabled = !response.ok;
      // TODO: check if nickname is already taken
    } else {
      submitButton.disabled = true;
    }
  });

  const avatarInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  avatarInput.addEventListener('change', (_event) => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const target = event.target as FileReader;
      const result = target.result as string;
      document.documentElement.style.setProperty('--input-setup-image', `url(${result})`);
    };
    reader.readAsDataURL(file);
  });
});

</script>

<template>
  <main>
    <h1>Let's set up your profile!</h1>
    <form>
      <label for="nickname">Nickname</label>
      <input type="text" id="nickname" name="nickname" placeholder="Enter a nickname" minlength="3" maxlength="20" required>
      <label for="avatar">Avatar</label>
      <input type="file" id="avatar" name="avatar" accept="image/png" >
      <input type="submit" value="Submit" disabled>
    </form>
  </main>
</template>

<style>
:root {
  --input-setup-image: url(/profile_empty.png);
}
</style>

<style scoped>
main {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

form {
  display: flex;
  flex-direction: column;
}

input[type=text] {
  padding: 0.5em 1em;
  border-radius: 0.5em;
  border: 1px solid #ccc;
  font-size: 1.5em;
  margin-bottom: 1em;
}

input[type="file"] {
  display: block !important;
}

input[type=file] {
  visibility: hidden;
}

input[type=file]::before {
  content: '';
  visibility: visible;
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-block;
  width: 10em;
  height: 10em;
  background: no-repeat var(--input-setup-image) center center / cover;
  -moz-border-radius: 5em;
  -webkit-border-radius: 5em;
  border-radius: 5em;
  border: 1px solid #ccc;
}

input[type=submit] {
  margin-top: 1em;
  padding: 0.5em 1em;
  border-radius: 0.5em;
  background-color: #2ecc71;
  color: white;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  border: 1px solid #ccc;
  transition: background-color 0.2s ease-in-out;
}

input[type=submit]:hover {
  background-color: #27ae60;
}

input[type=submit]:disabled {
  background-color: #69b388;
  color: #555;
  cursor: not-allowed;
}

</style>
