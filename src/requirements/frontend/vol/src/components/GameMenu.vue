<template>
    <div v-if="gameOn === false">
      <div class="menu">
        <div class="component-box">
          <h1 v-if="notYet === false">Welcome to fuck up pong</h1>
          <h1 v-else>Bueno verás, el modo porro como que todavia no está lol</h1>
          <button @click="toogleGameOn">Classic</button>
          <button @click="lolPorro">Porro mode</button>
        </div>
      </div>
    </div>
    <div v-else id="game">
      <Game/>
    </div>
  </template>
    
  <script setup lang="ts">
  //import menu from GameMenu.vue
  import { ref, onMounted } from 'vue';
  import Game from "./Game.vue";
  
  const gameOn = ref(false);//this variable will change between game and menu
  const notYet = ref(false);
  
  function toogleGameOn() {
    gameOn.value = true;
  }
  
  function toogleGameOff() {
    gameOn.value = true;
  }
  
  function lolPorro() {
    notYet.value = true;
  }
  
  onMounted(() => {
    console.log('gameOn state is ${gameOn.value}');
  })
  </script>
  
  <style>
  .menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-image: url("https://i.pcmag.com/imagery/lineups/05iHmFr0tEAZIygNJS5eoIf-1..v1569492725.jpg");
    background-size: cover;
    background-position: center center;
  }
  
  .component-box {
    border: 1px solid #ccc;
    padding: 1rem;
    text-align: center;
    border-radius: 0.5rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    background-color: aliceblue;
  }
  
  .menu h1 {
    font-size: 3rem;
    margin-top: 2rem;
  }
  
  .menu button {
    padding: 1rem 2rem;
    font-size: 1.5rem;
    background-color: #cb501b;
    color: #570de1;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-bottom: 1rem;
  }
  
  .menu button + button {
    margin-left: 10px;
  }
  
  .menu button:hover {
    background-color: #2980b9;
  }
  
  
  
  </style>