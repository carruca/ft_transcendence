<script setup lang="ts">
import { ref } from "vue";
import FA from "./2FA.vue";

const enable2fa = ref(!document.cookie.includes("_2fa="));
const secret2fa = ref<string | undefined>(undefined);
const show2fa = ref(false);

</script>


<template>
    <section class="settings">
        <h2>Settings</h2>
        <FA v-if="show2fa" :hasParent="true" @close2fa="show2fa = false" />
        <button @click="show2fa = !show2fa">
            {{ enable2fa ? 'Enable' : 'Disable' }} 2FA
        </button>
    </section>
</template>


<style scoped>
section {
    width: 100%;
    height: 100%;
}

p, h2 {
    color: var(--color-text);
}

</style>
