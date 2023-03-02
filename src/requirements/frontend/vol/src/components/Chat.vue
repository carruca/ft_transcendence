<script setup lang="ts">
import { ref, onMounted } from "vue";
import io from "socket.io-client";

interface Message {
  user: string;
  content: string;
}

const socket = io("http://localhost:3000");

const usernameAlreadySet = ref<boolean>(false);
const username = ref<string>("");
const users = ref<string[]>([]);

const content = ref<string>("");
const lastMessages = ref<Message[]>([]);

onMounted(() => {
  socket.on("connect", (data: string) => {
    console.log("[websocket] initialized.");
  });
});

const setUsername = (name: string) => {
  if (name && !users.value.includes(name)) {
    console.log(`Username selected: '${name}'`);
    usernameAlreadySet.value = true;
    users.value.push(name);
  }
};

const sendMessage = (data: string) => {
  if (username.value && content.value) {
    console.log(`Sending input message to server: '${data}'`);
    socket.emit("message", { user: username.value, content: content.value });
    content.value = "";
  }
};

socket.on("message", (data: Message) => {
  console.log(`Receiving new message from server: '${data.content}'`);
  lastMessages.value.push({ user: data.user, content: data.content });
});
</script>

<template>
  <div v-if="!usernameAlreadySet">
    <h1>Your username</h1>
    <input v-model.trim="username" @keyup.enter="setUsername(username)" />
    <button @click="setUsername(username)">Send</button>
  </div>
  <div v-else>
    <div v-for="user in users">
      <div>
        <strong>{{ user }}</strong>
      </div>
    </div>
    <h1>Chat room</h1>
    <div v-for="message in lastMessages">
      <div>
        <strong>{{ message.user }}:</strong> {{ message.content }}
      </div>
    </div>
    <div>
      <input v-model.trim="content" @keyup.enter="sendMessage(content)" />
      <button @click="sendMessage(content)">Send</button>
    </div>
  </div>
</template>
