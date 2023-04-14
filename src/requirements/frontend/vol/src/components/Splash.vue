<script setup lang="ts">

</script>

<template>
  <div class="splash__div">
    <img src="/favicon.png" alt="">
    <h1>ft_transcendence</h1>
  </div>
</template>

<style scoped>
.splash__div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
}

.splash__div img {
  width: 256px;
  height: 256px;
}

.splash__div h1 {
  color: var(--h1-color);
  font-size: 2rem;
}
</style>
