<template>
  <div v-if="visible" ref="contextMenuRef" class="context-menu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <ul>
      <li v-for="option in options" :key="option" @click="() => selectOption(option)">
        {{ option }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  visible: Boolean,
  options: Array,
  position: Object,
  item: Object
});
const emit = defineEmits(['select']);

const contextMenuRef = ref(null);

const selectOption = (option) => {
  emit('select', { option, item: props.item });
};

watch(() => props.visible, async(newValue) => {
  if (newValue) {
    await nextTick();
    adjustPositionIfNeeded();
  }
});
const adjustPositionIfNeeded = () => {
  const menu = contextMenuRef.value;
  if (!menu) return;

  const menuRect = menu.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  if (menuRect.bottom > viewportHeight) {
    const overflow = menuRect.bottom - viewportHeight;
    props.position.y -= overflow + 10; // Additional 10px for margin
  }
};
</script>

<style scoped>
.context-menu {
  position: absolute;
  color: white;
  background-color: #272727;
  /*border: 1px solid #ddd;*/
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.context-menu ul {
  list-style: none;
  list-style-type: none;
  margin: 0;
  padding: 0;
}
.context-menu li {
  padding: 0.5em 1em;
  padding-right: 2em;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid #444;
}
.context-menu li:hover {
  background-color: #444;
}
</style>