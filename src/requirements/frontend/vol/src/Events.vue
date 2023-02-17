<template>	
  <div>
    <h1>Events</h1>
    <div>
      <input type="text" v-model="message" />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup lang=ts>
import {
	ref,
	onMounted,
} from 'vue';
import io from 'socket.io-client';

const message = ref("");
const socket = io('http://localhost:3000');

onMounted(() => {
	console.log("Pasa por aqui!");
	socket.on('new-message', (data) => {
		message.value = data;
	})
})

const sendMessage = () => {
	console.log(`Sending message value = '${message.value}'`);
	socket.emit('send-message', message.value);
	message.value = '';
};

socket.on('new-message', (data: string) => {
	message.value = data;
	console.log(`Receiving new message value = '${message.value}'`);
});

</script>
