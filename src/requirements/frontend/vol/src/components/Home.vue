<script setup lang="ts">
import NavBar from './NavBar.vue';
import TopBar from './TopBar.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: undefined
  }
})

// TODO: Get current user image pic
// TODO: Separate this into components

</script>

<template>
  <div class="main_content">
    <TopBar :user="props.user" />
    <NavBar :admin="props.user.admin || true"/>  <!-- TODO: get props.user.admin-->
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.main_content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  display: flex;
}

ul {
  list-style: none;
}

main {
  display: flex;
  width: 100%;
  height: calc(100% - 5em);
  background: var(--bg-color);
  align-self: flex-end;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
</style>
