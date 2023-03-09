<script lang="ts">
import { defineComponent } from "vue";

const DEFAULT_TIMEOUT = 3 * 1000;  // 3 seconds

export default defineComponent({
  props: {
    errorMessage: {
      type: String as () => string,
      required: true,
    },
    timeout: {
      type: Number as () => number,
      required: false,
      default: DEFAULT_TIMEOUT,
    },
    transitionTimeout: {
      type: String as () => string,
      required: false,
      default: "1s",
    },
    background: {
      type: String as () => string,
      required: false,
      default: "#f00",
    },
    color: {
      type: String as () => string,
      required: false,
      default: "#fff",
    },
    image: {
      type: String as () => string,
      required: false,
      default: "",
    },
  },
  mounted: function () {
    window.setTimeout(() => {
      this.$el.style.opacity = "0";
      window.setTimeout(() => {
        this.$el.remove();
      }, parseInt(this.transitionTimeout) * 1000);
    }, this.timeout);
  },
});

</script>

<template>
  <div class="toast">
    <div class="toast__content">
      <img v-if="image" :src="image" />
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