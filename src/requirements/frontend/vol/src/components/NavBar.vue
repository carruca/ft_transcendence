<script setup lang="ts">
</script>

<template>
  <nav>
    <ul>
      <li><router-link to="/"><span class="material-icons">home</span></router-link></li>
      <li><router-link to="/game"><span class="material-icons">videogame_asset</span></router-link></li>
      <li><router-link to="/chat"><span class="material-icons">chat</span></router-link></li>
      <li><router-link to="/profile"><span class="material-icons">person</span></router-link></li>
    </ul>
  </nav>
</template>

<style scoped>
nav {
  width: 5.5em;
  height: 100%;
  background: var(--navbar-bg-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}

nav ul {
  padding: 5em 0;
  margin: 0;
  width: 100%;
}

nav ul li {
  width: 100%;
  height: 4em;
  transition: background-color 0.2s ease-in-out;
}

nav ul li:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

nav ul li a {
  color: var(--color-text);
  text-decoration: none;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
