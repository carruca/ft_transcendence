<script lang="ts">
export const DEFAULT_TIMEOUT = 3 * 1000; // 3 seconds in ms
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const toast = ref<HTMLElement | null>(null);

onMounted(function () {
  window.setTimeout(() => {
    toast.value!!.style.opacity = "0";
    window.setTimeout(() => {
      toast.value!!.remove();
    }, parseInt(props.transitionTimeout) * 1000);
  }, props.timeout);
});

const props = defineProps({
  errorMessage: {
    type: String,
    required: true,
  },
  timeout: {
    type: Number,
    default: DEFAULT_TIMEOUT,
  },
  transitionTimeout: {
    type: String,
    default: "1s",
  },
  background: {
    type: String,
    default: "#f44336",
  },
  color: {
    type: String,
    default: "#fafafa",
  },
  image: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="toast" ref="toast">
    <div class="toast__content">
      <slot />
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.toast {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  /* Transition when switching toast visibility, using transitionTimeout */
  transition: opacity v-bind(transitionTimeout) cubic-bezier(1, 0.01, 0.6, 1);
}

.toast__content {
  background: v-bind(background);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.5);
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  gap: 1rem;
}

.toast__content img {
  width: 2rem;
  height: 2rem;
  margin-right: 1rem;
}

.toast__content p {
  font-size: 1.2rem;
  text-align: left;
  color: v-bind(color);
}
</style>
